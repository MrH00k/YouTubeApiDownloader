 // // // // // // // // // // // // // // // // // // // //
//  __   __  ______    __   __  _______  _______  ___   _  //
// |  |_|  ||    _ |  |  | |  ||       ||       ||   | | | //
// |       ||   | ||  |  |_|  ||   _   ||   _   ||   |_| | //
// |       ||   |_||_ |       ||  | |  ||  | |  ||      _| //
// |       ||    __  ||       ||  |_|  ||  |_|  ||     |_  //
// | ||_|| ||   |  | ||   _   ||       ||       ||    _  | //
// |_|   |_||___|  |_||__| |__||_______||_______||___| |_| //
 // // // // // // // // // // // // // // // // // // // //

const express = require('express');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'src'), { index: 'index.html' }));

app.post('/api', async (req, res) => {
  const { yturl, format, quality } = req.body;

  if (!ytdl.validateURL(yturl)) {
    res.status(400).json({ error: 'URL no válida' });
    return;
  }

  if (format === 'video' || format === 'audio' || format === 'all') {
    try {
      const info = await ytdl.getInfo(yturl);
      let qualityOptions = [];
      const title = info.videoDetails.title;
      const thumbnails = info.videoDetails.thumbnails;
      const thumbnail = thumbnails[thumbnails.length - 1].url;

      if (format === 'video' || format === 'all') {
        const videoFormats = ytdl.filterFormats(info.formats, 'videoonly');
        const uniqueQualities = new Set();

        videoFormats.forEach((format) => {
          if (!uniqueQualities.has(format.qualityLabel)) {
            uniqueQualities.add(format.qualityLabel);
            qualityOptions.push({
              format: 'video',
              quality: format.qualityLabel,
              url: format.url,
            });
          }
        });
      }
      
      if (format === 'audio' || format === 'all') {
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const uniqueQualities = new Set();

        audioFormats.forEach((format) => {
          if (!uniqueQualities.has(format.audioQuality)) {
            uniqueQualities.add(format.audioQuality);
            qualityOptions.push({
              format: 'audio',
              quality: format.audioQuality,
              url: format.url,
            });
          }
        });
      }

      let filteredQualityOptions = [];

      if (quality) {
        filteredQualityOptions = qualityOptions.filter((option) => option.quality === quality);
      } else {
        filteredQualityOptions = qualityOptions;
      }

      const response = {
        url: yturl,
        title: title,
        thumbnail: thumbnail,
        format: format,
        quality: filteredQualityOptions,
      };

      res.json(response);
    } catch (error) {
      //console.log('\x1b[31mError al obtener las calidades de descarga\x1b[0m', error);
      res.status(400).json({ error: 'URL no válida' });
      return;
    }
  } else {
    const response = {
      error: 'Parece que no tenemos ese formato',
    };

    res.json(response);
  }
});

app.post('/api/download', async (req, res) => {
  const { yturl, format, quality } = req.body;

  if (!ytdl.validateURL(yturl)) {
    res.status(400).json({ error: 'URL no válida' });
    return;
  }

  try {
    const info = await ytdl.getInfo(yturl);
    let selectedVideoFormat;
    let selectedAudioFormat;

    if (format === 'video') {
      selectedVideoFormat = info.formats.find(format => format.qualityLabel === quality && format.hasVideo);
      selectedAudioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    } else if (format === 'audio') {
      selectedAudioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
    } else {
      res.status(400).json({ error: 'Formato no válido' });
      return;
    }

    if (format === 'video' && (!selectedVideoFormat || !selectedAudioFormat)) {
      res.status(404).json({ error: 'Formato no encontrado' });
      return;
    } else if (format === 'audio' && !selectedAudioFormat) {
      res.status(404).json({ error: 'Formato no encontrado' });
      return;
    }

    const uniqueId = uuidv4();
    const videoFileName = sanitize(info.videoDetails.title) + '_' + uniqueId + '.mp4';
    const videoFilePath = './api/download/' + videoFileName;
    const audioFilePath = './api/download/' + sanitize(info.videoDetails.title) + '_' + uniqueId + '.mp3';
    const filenameFinal = sanitize(info.videoDetails.title) + '_' + uniqueId + '_Converted.mp4';
    const filenameFinalAudio = sanitize(info.videoDetails.title) + '_' + uniqueId + '.mp3';
    const outputFilePath = './api/download/' + filenameFinal;

    if (format === 'video') {
      const videoStream = ytdl.downloadFromInfo(info, { format: selectedVideoFormat });
      const audioStream = ytdl.downloadFromInfo(info, { format: selectedAudioFormat });

      const videoWritableStream = fs.createWriteStream(videoFilePath);
      const audioWritableStream = fs.createWriteStream(audioFilePath);

      videoStream.pipe(videoWritableStream);
      audioStream.pipe(audioWritableStream);

      videoWritableStream.on('finish', () => {
        mergeVideoAndAudio(videoFilePath, audioFilePath, outputFilePath, res, filenameFinal);
      });

      audioWritableStream.on('finish', () => {
      });
    } else if (format === 'audio') {
      const audioWritableStream = fs.createWriteStream(audioFilePath);
      const audioStream = ytdl.downloadFromInfo(info, { format: selectedAudioFormat });

      audioStream.pipe(audioWritableStream);

      audioWritableStream.on('finish', () => {
        res.status(200).json({ message: 'Descarga completada', fileName: filenameFinalAudio });
      });
    }
  } catch (error) {
    console.log('\x1b[31mError al descargar el video o audio\x1b[0m', error);
    res.status(500).json({ error: 'Error al descargar el video o audio' });
  }
});

function mergeVideoAndAudio(videoFilePath, audioFilePath, outputFilePath, res, filenameFinal) {
  ffmpeg()
    .input(videoFilePath)
    .input(audioFilePath)
    .audioCodec('aac')
    .videoCodec('copy')
    .on('end', () => {
      deleteFile(videoFilePath);
      deleteFile(audioFilePath);
      res.status(200).json({ message: 'Descarga completada', fileName: filenameFinal });
    })
    .on('error', (error) => {
      console.log('\x1b[31mError al fusionar video y audio\x1b[0m', error);
      res.status(500).json({ error: 'Error al fusionar video y audio' });
    })
    .save(outputFilePath);
}

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      //console.log('\x1b[31mError al eliminar el archivo:', filePath, '\x1b[0m', err);
    }
  });
}

app.get('/api/download/file/:fileName', async (req, res) => {
  const { fileName } = req.params;
  if (fileName) {
    const filePath = path.join(__dirname, 'api', 'download', fileName);
    if (fs.existsSync(filePath)) {
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error al descargar el archivo:', err);
          res.status(500).json({ error: 'Error al descargar el archivo' });
        } else {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              //console.error('Error al eliminar el archivo:', unlinkErr);
            }
          });
        }
      });
    } else {
      res.status(404).json({ error: 'El archivo no existe' });
    }
  } else {
    res.status(400).json({ error: 'Nombre de archivo no proporcionado' });
  }
});

const server = app.listen(3000, () => {
  console.log('Servidor en ejecución en el puerto 3000');
  const url = 'http://localhost:3000';
  exec(getOpenCommand(url), (error, stdout, stderr) => {
    if (error) {
      console.error('Error al abrir el navegador:', error);
    }
  });
});

function getOpenCommand(url) {
  switch (process.platform) {
    case 'darwin':
      return `open ${url}`;
    case 'win32':
      return `start ${url}`;
    default:
      return `xdg-open ${url}`;
  }
}
