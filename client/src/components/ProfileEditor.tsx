/**
 * ProfileEditor Component
 * Allows users to edit profile photo, skills, and add videos
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, X, Plus, Upload, Video, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileEditorProps {
  onClose?: () => void;
  onSave?: () => void;
}

export default function ProfileEditor({ onClose, onSave }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState<"photo" | "skills" | "videos">("photo");
  const [newSkill, setNewSkill] = useState({ name: "", category: "", yearsOfExperience: 0 });

  // Queries
  const { data: photos, isLoading: photosLoading } = trpc.userMedia.getByUser.useQuery({
    type: "photo",
  });
  const { data: videos, isLoading: videosLoading } = trpc.userMedia.getByUser.useQuery({
    type: "video",
  });
  const { data: skills, isLoading: skillsLoading } = trpc.userSkills.getByUser.useQuery();

  // Mutations
  const addPhoto = trpc.userMedia.add.useMutation();
  const addVideo = trpc.userMedia.add.useMutation();
  const setMainPhoto = trpc.userMedia.setMain.useMutation();
  const deleteMedia = trpc.userMedia.delete.useMutation();
  const addSkillMutation = trpc.userSkills.add.useMutation();
  const deleteSkill = trpc.userSkills.delete.useMutation();

  const handlePhotoUpload = async (file: File) => {
    try {
      // In a real app, upload to S3 first using manus-upload-file
      // For now, create a data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        await addPhoto.mutateAsync({
          type: "photo",
          url: dataUrl,
          title: file.name,
          isMain: !photos || photos.length === 0,
        });
        toast.success("Foto agregada exitosamente");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Error al subir la foto");
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        await addVideo.mutateAsync({
          type: "video",
          url: dataUrl,
          title: file.name,
        });
        toast.success("Video agregado exitosamente");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Error al subir el video");
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
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                <label className="cursor-pointer">
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
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                <label className="cursor-pointer">
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
