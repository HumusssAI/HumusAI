"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageUploader() {

  const [selectedImage, setSelectedImage] = useState(null);

  function handleImageChange(event) {

    const file = event.target.files[0];

    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  }

  return (

    <div className="mt-16 w-full max-w-2xl">

      <h2 className="text-2xl font-bold text-green-500 mb-6">
        Análisis visual IA
      </h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-6"
      />

      {selectedImage && (

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

          <Image
            src={selectedImage}
            alt="Preview"
            width={500}
            height={500}
            className="rounded-xl object-cover"
          />

        </div>

      )}

    </div>
  );
}