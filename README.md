# YouTubeApiDownloader
<h1 align="center">Hi 👋, I'm MrH00k</h1>
<h3 align="center">A passionate Frontend and Backend developer from México</h3>

### `How the API works`
  You need to have ffmpeg (https://ffmpeg.org/) installed on your computer for it to work properly.
| 💊 Function  | 🔗 URL | 🔍 Variables to send via POST (except for the file download by name which is by GET)
|:--------:|:--------------:|:--------------:|
| `Get all download links (Video & Audio)` | http://localhost:3000/api | `yturl = <url>` `format = all` |
| `Get all video download links` | http://localhost:3000/api | `yturl = <url>` `format = video` |
| `Get all audio download links` | http://localhost:3000/api | `yturl = <url>` `format = audio` |
| `Get the video download link of a specific quality` | http://localhost:3000/api | `yturl = <url>` `format = video` `quality = 144p : 240p : 360p: 480p : 720p : 1080p : 1440p : 2160p` |
| `Get the audio download link of a specific quality` | http://localhost:3000/api | `yturl = <url>` `format = audio` `quality = AUDIO_QUALITY_ULTRALOW : AUDIO_QUALITY_LOW : AUDIO_QUALITY_MEDIUM : AUDIO_QUALITY_HIGH` |
| `Download video to the server for later downloading` | http://localhost:3000/api/download | `yturl = <url>` `format = video` `quality = 144p : 240p : 360p: 480p : 720p : 1080p : 1440p : 2160p` |
| `Download audio to the server for later downloading` | http://localhost:3000/api/download | `yturl = <url>` `format = audio` `quality = AUDIO_QUALITY_ULTRALOW : AUDIO_QUALITY_LOW : AUDIO_QUALITY_MEDIUM : AUDIO_QUALITY_HIGH`|
| `Download by file name` | http://localhost:3000/api/download/file/ | `<filename>` |

<h3 align="left">Connect with me:</h3>
<p align="left">
<a href="https://www.facebook.com/mrh00k404"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/facebook.svg" alt="mrh00k404" height="30" width="40" /></a>
</p>
