"use client";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
//import heic2any from "heic2any";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    { file: File; url: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(0.7);
  const [pageSize, setPageSize] = useState("original");

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(e.target.files || []);

    const processedFiles: File[] = [];

    for (const file of selectedFiles) {
      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic")
      ) {
        try {
          const heic2any = (await import("heic2any")).default;

          const convertedBlob = (await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8,
          })) as Blob;

          const convertedFile = new File(
            [convertedBlob],
            file.name.replace(/\.heic$/i, ".jpg"),
            {
              type: "image/jpeg",
            }
          );

          processedFiles.push(convertedFile);
        } catch (err) {
          console.error(err);
        }
      } else {
        processedFiles.push(file);
      }
    }

    setFiles((prev) => [...prev, ...processedFiles]);

    const previewUrls = processedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews((prev) => [...prev, ...previewUrls]);
  };

  const removeImage = (indexToRemove: number) => {
    setFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );

    setPreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const moveImage = (
    index: number,
    direction: "left" | "right"
  ) => {
    const newFiles = [...files];
    const newPreviews = [...previews];

    const targetIndex =
      direction === "left" ? index - 1 : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= files.length
    ) {
      return;
    }

    [newFiles[index], newFiles[targetIndex]] = [
      newFiles[targetIndex],
      newFiles[index],
    ];

    [newPreviews[index], newPreviews[targetIndex]] = [
      newPreviews[targetIndex],
      newPreviews[index],
    ];

    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const createPdf = async () => {
    if (files.length === 0) {
      alert("Please select images");
      return;
    }

    try {
      setLoading(true);

      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const imageBitmap = await createImageBitmap(file);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) continue;

        const maxWidth = 1200;
        const scale = Math.min(
          1,
          maxWidth / imageBitmap.width
        );

        canvas.width = imageBitmap.width * scale;
        canvas.height = imageBitmap.height * scale;

        ctx.drawImage(
          imageBitmap,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compressedBlob = await new Promise<Blob | null>(
          (resolve) =>
            canvas.toBlob(
              resolve,
              "image/jpeg",
              quality
            )
        );

        if (!compressedBlob) continue;

        const compressedBytes =
          await compressedBlob.arrayBuffer();

        const image = await pdfDoc.embedJpg(
          compressedBytes
        );

        let width = image.width;
        let height = image.height;

        if (pageSize === "a4") {
          width = 595;
          height = 842;
        }

        if (pageSize === "letter") {
          width = 612;
          height = 792;
        }

        const page = pdfDoc.addPage([
          width,
          height,
        ]);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const pdfBytes = await pdfDoc.save();

      /*const blob = new Blob([pdfBytes], {
        type: "application/pdf",
      });*/
      const blob = new Blob([pdfBytes as BlobPart], {
      type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "images-to-pdf.pdf";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to create PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 dark:bg-black">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-6xl dark:bg-zinc-900 dark:text-white">
        <h1 className="text-3xl font-bold text-center mb-2">
          Image to PDF
        </h1>

        <p className="text-center text-gray-500 mb-8 dark:text-gray-400">
          Convert images into PDF directly in your browser
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();

            const syntheticEvent = {
              target: {
                files: e.dataTransfer.files,
              },
            } as React.ChangeEvent<HTMLInputElement>;

            handleFileChange(syntheticEvent);
          }}
        >
          <label className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-black transition bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700">
            <input
              type="file"
              multiple
              accept="image/*,.heic"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-lg font-semibold">
              Upload or Drop Images
            </p>

            <p className="text-sm text-gray-500 mt-1">
              JPG, PNG, WEBP, HEIC
            </p>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Compression Quality
            </label>

            <input
              type="range"
              min="0.3"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) =>
                setQuality(Number(e.target.value))
              }
              className="w-full"
            />

            <p className="text-sm text-gray-500 mt-2">
              Current: {Math.round(quality * 100)}%
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              PDF Page Size
            </label>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700"
            >
              <option value="original">
                Original Image Size
              </option>
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </select>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold mb-4">
              Selected Images ({previews.length})
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="border rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <img
                    src={preview.url}
                    alt="preview"
                    className="w-full h-40 object-cover"
                  />

                  <div className="p-3">
                    <p className="text-sm truncate font-medium">
                      {preview.file.name}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {(preview.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() =>
                          moveImage(index, "left")
                        }
                        className="border rounded px-2 py-1 text-xs"
                      >
                        ←
                      </button>

                      <button
                        onClick={() =>
                          moveImage(index, "right")
                        }
                        className="border rounded px-2 py-1 text-xs"
                      >
                        →
                      </button>

                      <button
                        onClick={() => removeImage(index)}
                        className="text-red-500 text-xs ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={createPdf}
          disabled={loading || files.length === 0}
          className="w-full mt-8 bg-black text-white py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition dark:bg-white dark:text-black"
        >
          {loading
            ? "Creating PDF..."
            : "Convert to PDF"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Files never leave your device
        </p>

<div className="max-w-4xl mx-auto mt-16 space-y-12 text-left px-4 pb-4">

  <section>
    <h2 className="text-2xl font-bold mb-4">
      Free Image to PDF Converter
    </h2>

    <p className="text-gray-600 dark:text-gray-300 leading-7">
      Convert JPG, PNG, WEBP and HEIC images into PDF directly in your browser.
      Your files never leave your device, making the conversion process fast,
      private and secure.
    </p>
  </section>

  <section>
    <h2 className="text-2xl font-bold mb-4">
      Why Use This Tool?
    </h2>

    <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
      <li>No image uploads required</li>
      <li>Fast browser-based conversion</li>
      <li>Supports JPG, PNG, WEBP and HEIC</li>
      <li>Works on mobile and desktop</li>
      <li>Reorder images before generating PDF</li>
      <li>Adjust compression quality</li>
      <li>Completely free to use</li>
    </ul>
  </section>

  <section>
    <h2 className="text-2xl font-bold mb-4">
      How It Works
    </h2>

    <div className="space-y-3 text-gray-600 dark:text-gray-300">
      <p>1. Upload one or multiple images.</p>
      <p>2. Reorder images if needed.</p>
      <p>3. Adjust PDF quality settings.</p>
      <p>4. Click Convert and download your PDF.</p>
    </div>
  </section>

  <section>
    <h2 className="text-2xl font-bold mb-4">
      Frequently Asked Questions
    </h2>

    <div className="space-y-6 text-gray-600 dark:text-gray-300">

      <div>
        <h3 className="font-semibold mb-1">
          Are my images uploaded to a server?
        </h3>

        <p>
          No. All image processing happens directly in your browser.
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">
          Does this support iPhone HEIC images?
        </h3>

        <p>
          Yes. HEIC images are automatically converted before generating the PDF.
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">
          Is this tool free?
        </h3>

        <p>
          Yes. The tool is completely free to use.
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">
          Can I use this on mobile?
        </h3>

        <p>
          Yes. The tool works on Android, iPhone, tablets and desktop browsers.
        </p>
      </div>

    </div>
  </section>

</div>
      </div>
    </main>
  );
}
