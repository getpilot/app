"use server";

async function generateSHA1(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export async function uploadImage(base64Image: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.round(new Date().getTime() / 1000).toString();

  const params = {
    timestamp: timestamp,
    folder: "pilot-pfps",
  };

  if (!base64Image.startsWith("data:image/jpeg;base64,")) {
    base64Image = `data:image/jpeg;base64,${base64Image}`;
  }

  const paramString =
    Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&") + apiSecret;

  const signature = await generateSHA1(paramString);

  const formData = new URLSearchParams({
    file: base64Image,
    api_key: apiKey || "",
    signature: signature,
    ...params,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[CLOUDINARY_UPLOAD_ERROR]", error);
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const data = await response.json();
  return data.secure_url;
}