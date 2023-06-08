document.addEventListener('DOMContentLoaded', async () => {
    const { value: url } = await Swal.fire({
        title: 'Ingresa una URL',
        icon: 'question',
        input: 'url',
        allowOutsideClick: false,
        allowEscapeKey: false,
        inputValidator: (value) => {
            if (!value) {
                return 'Ingresa una URL';
            }
        },
        showCancelButton: false,
        confirmButtonText: '<i class="fa-solid fa-square-check"></i> Validar',
        confirmButtonColor: '#3085d6',
    });

    if (url) {
        Swal.fire({
            title: 'Validando URL',
            icon: 'warning',
            footer: 'Powered by MrHook',
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    yturl: url,
                    format: 'all'
                }),
            });

            if (response.ok) {
                const data = await response.json();

                const inputOptions = {
                    'Video': {},
                    'Audio': {
                        mp3: 'MP3'
                    }
                };

                for (const quality of data.quality) {
                    if (quality.format === 'video') {
                        inputOptions['Video'][`${quality.quality}`] = quality.quality;
                    }
                }

                Swal.close();

                const { value: quality, dismiss } = await Swal.fire({
                    title: data.title,
                    imageUrl: data.thumbnail,
                    input: 'select',
                    inputOptions: inputOptions,
                    showCancelButton: true,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Selecciona un formato';
                        }
                    },
                    confirmButtonText: '<i class="fa-solid fa-play"></i> Convertir',
                    cancelButtonText: '<i class="fa-solid fa-ban"></i> Cancelar',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                });

                if (dismiss === Swal.DismissReason.cancel) {
                    location.reload();
                } else if (quality) {
                    const isVideo = Object.keys(inputOptions['Video']).includes(quality);
                    const isAudio = Object.keys(inputOptions['Audio']).includes(quality);
                    var format;
                    if (isAudio) {
                        format = 'audio';
                    } else if (isVideo) {
                        format = 'video';
                    }
                    Swal.fire({
                        icon: 'success',
                        title: 'Convirtiendo...',
                        footer: 'Powered by MrHook',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    await downloadFormat(url, format, quality);
                    Swal.close();
                }
            } else {
                Swal.close();
                const data = await response.json();
                if (response.status === 400 && data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'URL Inválida',
                        showConfirmButton: false,
                        timer: 1500,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        timerProgressBar: true,
                    }).then((result) => {
                        if (result.dismiss === Swal.DismissReason.timer) {
                            location.reload();
                        }
                    });
                }
            }
        } catch (error) {
            Swal.close();
            console.error('Error en la solicitud:', error);
        }
    }
});

async function downloadFormat(url, format, quality) {
    const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            yturl: url,
            format: format,
            quality: quality,
        }),
    });

    if (response.ok) {
        const data = await response.json();
        const downloadUrl = `${window.location.origin}/api/download/file/${data.fileName}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.location.reload();
    }
}
