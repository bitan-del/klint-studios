import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageUp, X, User } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';

const Uploader: React.FC<{
    onDrop: (acceptedFiles: File[]) => void;
    title: string;
    description: string;
    // FIX: Corrected prop type to resolve cloneElement error. Using React.ReactElement<any> allows cloning with additional props,
    // as TypeScript can struggle to infer props for generic icon components passed as elements.
    icon: React.ReactElement<any>;
}> = ({ onDrop, title, description, icon }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
        multiple: false
    });

    return (
        <div {...getRootProps()} className={`flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200 ${isDragActive ? 'border-violet-500 bg-violet-500/10 shadow-glow-md' : 'border-zinc-700 hover:border-zinc-600'}`}>
            <input {...getInputProps()} />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragActive ? 'bg-violet-500/20' : 'bg-zinc-800'}`}>
                {React.cloneElement(icon, { className: `transition-colors ${isDragActive ? 'text-violet-300' : 'text-zinc-400'}`, size: 32 })}
            </div>
            <p className="text-zinc-100 font-semibold text-center">
                {isDragActive ? "Drop the image here" : title}
            </p>
            <p className="text-sm text-zinc-400 mt-1 text-center">{description}</p>
        </div>
    );
};


export const ReimagineUploader: React.FC = () => {
    const { setReimagineSourcePhoto, reimagineSourcePhoto, newModelPhoto, setNewModelPhoto } = useStudio();

    const onSourceDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target?.result) {
                    setReimagineSourcePhoto(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [setReimagineSourcePhoto]);

    const onModelDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target?.result) {
                    setNewModelPhoto(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [setNewModelPhoto]);

    if (reimagineSourcePhoto) {
        return (
            <div className="w-full h-full animate-fade-in flex flex-col gap-4">
                <div>
                    <p className="text-sm font-medium text-zinc-300 mb-2 flex-shrink-0">Your Source Photo</p>
                    <div className="relative group rounded-lg overflow-hidden border-2 border-violet-500/50 shadow-lg shadow-violet-900/30 bg-zinc-900 aspect-square">
                        <img src={reimagineSourcePhoto} alt="Source photo preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button
                                onClick={() => setReimagineSourcePhoto(null)}
                                className="bg-red-600/80 hover:bg-red-500 text-white p-3 rounded-full transition-all duration-200 transform scale-75 group-hover:scale-100"
                                aria-label="Remove source photo"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-grow min-h-[150px] flex flex-col">
                    {newModelPhoto ? (
                        <div className="w-full h-full flex flex-col">
                            <p className="text-sm font-medium text-zinc-300 mb-2 flex-shrink-0">New Model Photo</p>
                            <div className="relative group flex-grow rounded-lg overflow-hidden border-2 border-green-500/50 bg-zinc-900">
                                <img src={newModelPhoto} alt="New model preview" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <button
                                        onClick={() => setNewModelPhoto(null)}
                                        className="bg-red-600/80 hover:bg-red-500 text-white p-2 rounded-full transition-all duration-200 transform scale-75 group-hover:scale-100"
                                        aria-label="Remove new model photo"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Uploader
                            onDrop={onModelDrop}
                            title="Upload New Model (Optional)"
                            description="Upload a photo of the new person"
                            icon={<User />}
                        />
                    )}
                </div>

            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <Uploader
                onDrop={onSourceDrop}
                title="Upload Source Photo"
                description="Upload an existing photo to edit"
                icon={<ImageUp />}
            />
        </div>
    );
};
