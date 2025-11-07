import { useState } from "react";
import { useAddGalleryImages, useGalleries } from "@/services/gallery";

export const GalleryEdit = () => {
    const [galleries, galleriesLoading, galleriesError] = useGalleries();
    const [selectedGallery, setSelectedGallery] = useState<string>("");
    const [selectedAlbum, setSelectedAlbum] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [uploadMessage, setUploadMessage] = useState<string>("");

    // Hook pour l'upload
    const [addImages, addImagesLoading, addImagesError] = useAddGalleryImages(
        selectedGallery,
        selectedAlbum,
        files
    );

    const handleGalleryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGallery(e.target.value);
        setSelectedAlbum("");
    };

    const handleAlbumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAlbum(e.target.value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files).filter(f =>
                f.type === "image/jpeg" || f.name.toLowerCase().endsWith(".jpg")
            ));
        }
    };

    const handleUpload = async () => {
        if (!selectedGallery || !selectedAlbum || files.length === 0) {
            setUploadMessage("Please select gallery, album, and files");
            return;
        }

        setUploadMessage("Uploading...");

        try {
            await addImages();
            setUploadMessage(`Success! Uploaded ${files.length} images`);
            setFiles([]);
            // Recharger les données
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error("Upload error:", error);
            setUploadMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    if (galleriesLoading) return <div>Loading galleries...</div>;
    if (galleriesError) return <div>Error loading galleries</div>;
    if (!galleries) return <div>No galleries found</div>;

    const currentGallery = galleries.find(g => g.name === selectedGallery);
    const albums = currentGallery?.albums || [];

    return (
        <div className="page active">
            <h1>Gallery Edit</h1>

            <div className="form-group">
                <label>Gallery:</label>
                <select value={selectedGallery} onChange={handleGalleryChange}>
                    <option value="">Select a gallery</option>
                    {galleries.map(gallery => (
                        <option key={gallery.name} value={gallery.name}>
                            {gallery.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedGallery && (
                <div className="form-group">
                    <label>Album:</label>
                    <select value={selectedAlbum} onChange={handleAlbumChange}>
                        <option value="">Select an album</option>
                        {albums.map(album => (
                            <option key={album.name} value={album.name}>
                                {album.name} ({album.images.length} images)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="form-group">
                <label>Upload JPG images:</label>
                <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,image/jpeg"
                    onChange={handleFileChange}
                    disabled={addImagesLoading}
                />
                <p>{files.length} file(s) selected</p>
            </div>

            <button
                onClick={handleUpload}
                disabled={addImagesLoading || !selectedGallery || !selectedAlbum || files.length === 0}
            >
                {addImagesLoading ? "Uploading..." : "Upload Images"}
            </button>

            {uploadMessage && (
                <p className={uploadMessage.includes("Success") ? "success" : "error"}>
                    {uploadMessage}
                </p>
            )}
        </div>
    );
};
