import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfFile from './../src/files/demo.pdf'

// Required for PDF worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ImageForm = ({fileUrl}) => {
    const [images, setImages] = useState([]);

    useEffect(() => {
        const convertPdfToImages = async () => {
            const pdf = await pdfjsLib.getDocument(pdfFile).promise;
            const numPages = pdf.numPages;
            const tempImages = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 }); // adjust scale for quality
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;

                // Convert canvas to base64 image
                const imgData = canvas.toDataURL('image/png');
                tempImages.push(imgData);
            }

            setImages(tempImages);
        };

        convertPdfToImages();
    }, [fileUrl]);

    return (
        <div>
            {images.map((src, index) => (
                <img key={index} src={src} alt={`Page ${index + 1}`} style={{ marginBottom: '10px', width: '100%' }} />
            ))}
        </div>
    );
};

export default ImageForm;