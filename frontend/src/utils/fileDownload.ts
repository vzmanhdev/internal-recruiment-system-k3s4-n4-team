/**
 * Tiện ích tải file an toàn trên trình duyệt, tương thích với Chrome/Edge/Firefox/Safari.
 * Đảm bảo gán đúng đuôi .xlsx, dispatch click event an toàn và không detach DOM sớm làm mất tên file.
 */
export function triggerFileDownload(
  data: Blob | ArrayBuffer,
  filename: string,
  mimeType: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
): void {
  const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", safeFilename);
  link.style.display = "none";
  document.body.appendChild(link);

  link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));

  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}
