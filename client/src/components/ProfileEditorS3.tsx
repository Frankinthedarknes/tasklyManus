/**
 * ProfileEditorS3 Component
 * Enhanced profile editor with S3 upload integration
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, X, Plus, Upload, Video, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useS3Upload } from "@/hooks/useS3Upload";

interface ProfileEditorS3Props {
  onClose?: () => void;
  onSave?: () => void;
}

export default function ProfileEditorS3({ onClose, onSave }: ProfileEditorS3Props) {
  const [activeTab, setActiveTab] = useState<"photo" | "skills" | "videos">("photo");
  const [newSkill, setNewSkill] = useState({ name: "", category: "", yearsOfExperience: 0 });
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);
  const [uploadingVideoId, setUploadingVideoId] = useState<string | null>(null);

  // Queries
  const { data: photos, isLoading: photosLoading, refetch: refetchPhotos } = 
    trpc.userMedia.getByUser.useQuery({ type: "photo" });
  const { data: videos, isLoading: videosLoading, refetch: refetchVideos } = 
    trpc.userMedia.getByUser.useQuery({ type: "video" });
  const { data: skills, isLoading: skillsLoading } = trpc.userSkills.getByUser.useQuery();

  // Mutations
  const addMedia = trpc.userMedia.add.useMutation();
  const setMainPhoto = trpc.userMedia.setMain.useMutation();
  const deleteMedia = trpc.userMedia.delete.useMutation();
  const addSkillMutation = trpc.userSkills.add.useMutation();
  const deleteSkill = trpc.userSkills.delete.useMutation();

  // S3 Upload Hook
  const { uploadFile: uploadPhotoFile, isUploading: isUploadingPhoto, progress: photoProgress } = 
    useS3Upload({
      onSuccess: async (url, key) => {
        try {
          await addMedia.mutateAsync({
            type: "photo",
            url,
            title: "Profile Photo",
            isMain: !photos || photos.length === 0,
          });
          await refetchPhotos();
          toast.success("Foto guardada exitosamente");
        } catch (error) {
          toast.error("Error al guardar foto");
        }
      },
    });

  const { uploadFile: uploadVideoFile, isUploading: isUploadingVideo, progress: videoProgress } = 
    useS3Upload({
      onSuccess: async (url, key) => {
        try {
          await addMedia.mutateAsync({
            type: "video",
            url,
            title: "Profile Video",
          });
          await refetchVideos();
          toast.success("Video guardado exitosamente");
        } catch (error) {
          toast.error("Error al guardar video");
        }
      },
    });

  const handlePhotoUpload = async (file: File) => {
    const uploadId = `photo-${Date.now()}`;
    setUploadingPhotoId(uploadId);
    try {
      await uploadPhotoFile(file, "photo");
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const handleVideoUpload = async (file: File) => {
    const uploadId = `video-${Date.now()}`;
    setUploadingVideoId(uploadId);
    try {
      await uploadVideoFile(file, "video");
    } finally {
      setUploadingVideoId(null);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.category) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      await addSkillMutation.mutateAsync({
        name: newSkill.name,
        category: newSkill.category,
        yearsOfExperience: newSkill.yearsOfExperience || undefined,
      });
      setNewSkill({ name: "", category: "", yearsOfExperience: 0 });
      toast.success("Habilidad agregada exitosamente");
    } catch (error) {
      toast.error("Error al agregar habilidad");
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    try {
      await deleteMedia.mutateAsync({ mediaId });
      if (activeTab === "photo") {
        await refetchPhotos();
      } else {
        await refetchVideos();
      }
      toast.success("Eliminado exitosamente");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await deleteSkill.mutateAsync({ skillId });
      toast.success("Habilidad eliminada");
    } catch (error) {
      toast.error("Error al eliminar habilidad");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-900 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Editar Perfil</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            {["photo", "skills", "videos"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === tab
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "photo" && "📸 Foto Principal"}
                {tab === "skills" && "💼 Habilidades"}
                {tab === "videos" && "🎬 Videos"}
              </button>
            ))}
          </div>

          {/* Photo Tab */}
          {activeTab === "photo" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer relative">
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                      <p className="text-white font-medium">
                        {photoProgress.percentage}%
                      </p>
                    </div>
                  </div>
                )}
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-300 font-medium">Sube tu foto principal</p>
                  <p className="text-sm text-slate-500">PNG, JPG hasta 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handlePhotoUpload(e.target.files[0]);
                      }
                    }}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {photosLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
                </div>
              ) : photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo: any) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className={`w-full h-32 object-cover rounded-lg ${
                          photo.isMain ? "ring-2 ring-blue-500" : ""
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                        {!photo.isMain && (
                          <Button
                            size="sm"
                            onClick={() => setMainPhoto.mutate({ mediaId: photo.id })}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Principal
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMedia(photo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {photo.isMain && (
                        <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">No hay fotos aún</p>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg space-y-3">
                <Input
                  placeholder="Nombre de la habilidad (ej: Limpieza)"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  placeholder="Categoría (ej: Hogar)"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  type="number"
                  placeholder="Años de experiencia"
                  value={newSkill.yearsOfExperience}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, yearsOfExperience: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  onClick={handleAddSkill}
                  disabled={addSkillMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Habilidad
                </Button>
              </div>

              {skillsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
                </div>
              ) : skills && skills.length > 0 ? (
                <div className="space-y-2">
                  {skills.map((skill: any) => (
                    <div
                      key={skill.id}
                      className="bg-slate-800 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">{skill.name}</p>
                        <p className="text-sm text-slate-400">
                          {skill.category}
                          {skill.yearsOfExperience && ` • ${skill.yearsOfExperience} años`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSkill(skill.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">No hay habilidades aún</p>
              )}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer relative">
                {isUploadingVideo && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                      <p className="text-white font-medium">
                        {videoProgress.percentage}%
                      </p>
                    </div>
                  </div>
                )}
                <label className="cursor-pointer block">
                  <Video className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-300 font-medium">Sube un video de presentación</p>
                  <p className="text-sm text-slate-500">MP4, WebM hasta 50MB</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleVideoUpload(e.target.files[0]);
                      }
                    }}
                    disabled={isUploadingVideo}
                    className="hidden"
                  />
                </label>
              </div>

              {videosLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="space-y-2">
                  {videos.map((video: any) => (
                    <div
                      key={video.id}
                      className="bg-slate-800 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-6 h-6 text-blue-400" />
                        <div>
                          <p className="font-medium text-white">{video.title}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(video.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteMedia(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">No hay videos aún</p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              Los archivos se suben directamente a S3. Máximo 5MB para fotos y 50MB para videos.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onSave?.();
                onClose?.();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
