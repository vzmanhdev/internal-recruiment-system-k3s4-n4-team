export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedAvatarResult {
  avatarUrl: string; // 500x500 bản chất lượng cao
  thumbnailUrl: string; // 150x150 bản thu nhỏ tối ưu tốc độ load
  avatarBlob: Blob;
  thumbnailBlob: Blob;
}

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Tính toán kích thước bao quanh khi ảnh xoay một góc degree
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Trích xuất vùng ảnh theo pixelCrop và rotation, xuất ra 2 phiên bản:
 * - 1 bản chuẩn 500x500px
 * - 1 bản thumbnail 150x150px
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0
): Promise<CroppedAvatarResult> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Không thể khởi tạo Canvas 2D context");
  }

  const rotRad = getRadianAngle(rotation);

  // Tính kích thước bao quanh cho ảnh đã xoay
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Thiết lập kích thước canvas bằng bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Dịch tâm xoay về giữa canvas và xoay
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Vẽ ảnh ban đầu lên canvas đã xoay
  ctx.drawImage(image, 0, 0);

  // 1. Tạo Canvas cho Bản Chuẩn 500x500px
  const targetSize = 500;
  const avatarCanvas = document.createElement("canvas");
  avatarCanvas.width = targetSize;
  avatarCanvas.height = targetSize;
  const avatarCtx = avatarCanvas.getContext("2d");

  if (!avatarCtx) {
    throw new Error("Không thể tạo Canvas cho Avatar");
  }

  avatarCtx.imageSmoothingEnabled = true;
  avatarCtx.imageSmoothingQuality = "high";

  // Cắt và vẽ lên avatarCanvas (500x500)
  avatarCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  // 2. Tạo Canvas cho Bản Thumbnail 150x150px
  const thumbSize = 150;
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = thumbSize;
  thumbCanvas.height = thumbSize;
  const thumbCtx = thumbCanvas.getContext("2d");

  if (!thumbCtx) {
    throw new Error("Không thể tạo Canvas cho Thumbnail");
  }

  thumbCtx.imageSmoothingEnabled = true;
  thumbCtx.imageSmoothingQuality = "high";

  // Cắt và vẽ lên thumbCanvas (150x150)
  thumbCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    thumbSize,
    thumbSize
  );

  // Chuyển đổi thành Blobs và Data URLs
  const avatarBlob = await new Promise<Blob>((resolve, reject) => {
    avatarCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Lỗi khi tạo Blob ảnh Avatar"));
      },
      "image/jpeg",
      0.92
    );
  });

  const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
    thumbCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Lỗi khi tạo Blob ảnh Thumbnail"));
      },
      "image/jpeg",
      0.85
    );
  });

  const avatarUrl = avatarCanvas.toDataURL("image/jpeg", 0.92);
  const thumbnailUrl = thumbCanvas.toDataURL("image/jpeg", 0.85);

  return {
    avatarUrl,
    thumbnailUrl,
    avatarBlob,
    thumbnailBlob,
  };
}
