"use client";

import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Users, Plus, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const RUBROS = [
  "CARNICERIA",
  "VERDULERIA",
  "FARMACIA",
  "VETERINARIA",
  "LIBRERIA",
  "COMIDA",
  "ROPA",
  "ELECTRONICA",
  "OTRO",
];

const ROLES = [
  { value: "cajero", label: "Cajero" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export default function AdminPage() {
  const {
    tiendas,
    usuarios,
    loadingTiendas,
    loadingUsuarios,
    createTienda,
    createUsuario,
    deleteUsuario,
    activateUsuario,
    onboarding, // 🎯 NUEVO
  } = useAdmin();

  const [newTienda, setNewTienda] = useState({
    nombre: "",
    rubro: "",
  });

  const [newUsuario, setNewUsuario] = useState({
    email: "",
    password: "",
    full_name: "",
    rol: "cajero",
    tienda_id: "",
  });

  // 🎯 NUEVO: Estado para onboarding rápido
  const [onboardingData, setOnboardingData] = useState({
    nombre_tienda: "",
    rubro: "",
    email: "",
    password: "",
    nombre_completo: "",
  });

  const [tiendaDialogOpen, setTiendaDialogOpen] = useState(false);
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false); // 🎯 NUEVO

  const handleCreateTienda = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTienda.mutateAsync(newTienda);
    setNewTienda({ nombre: "", rubro: "" });
    setTiendaDialogOpen(false);
  };

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUsuario.mutateAsync(newUsuario);
    setNewUsuario({
      email: "",
      password: "",
      full_name: "",
      rol: "cajero",
      tienda_id: "",
    });
    setUsuarioDialogOpen(false);
  };

  // 🎯 NUEVO: Handler para onboarding rápido
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    await onboarding.mutateAsync(onboardingData);
    setOnboardingData({
      nombre_tienda: "",
      rubro: "",
      email: "",
      password: "",
      nombre_completo: "",
    });
    setOnboardingDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-gray-600">
            Gestiona tiendas y usuarios del sistema
          </p>
        </div>
        {/* 🎯 Botón de Onboarding Rápido */}
        <Dialog open={onboardingDialogOpen} onOpenChange={setOnboardingDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <Plus className="h-5 w-5 mr-2" />
              Alta Rápida: Tienda + Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>🚀 Onboarding Rápido</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleOnboarding} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Datos de la Tienda</Label>
                <div>
                  <Label htmlFor="onb_tienda">Nombre del Negocio</Label>
                  <Input
                    id="onb_tienda"
                    value={onboardingData.nombre_tienda}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, nombre_tienda: e.target.value })
                    }
                    placeholder="Ej: Verdulería Pedrito"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="onb_rubro">Rubro</Label>
                  <Select
                    value={onboardingData.rubro}
                    onValueChange={(value: string) =>
                      setOnboardingData({ ...onboardingData, rubro: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rubro" />
                    </SelectTrigger>
                    <SelectContent>
                      {RUBROS.map((rubro) => (
                        <SelectItem key={rubro} value={rubro}>
                          {rubro}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-semibold">Datos del Dueño/Admin</Label>
                <div>
                  <Label htmlFor="onb_nombre">Nombre Completo</Label>
                  <Input
                    id="onb_nombre"
                    value={onboardingData.nombre_completo}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, nombre_completo: e.target.value })
                    }
                    placeholder="Ej: Pedro López"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="onb_email">Email</Label>
                  <Input
                    id="onb_email"
                    type="email"
                    value={onboardingData.email}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, email: e.target.value })
                    }
                    placeholder="pedrito@verduleria.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="onb_password">Contraseña</Label>
                  <Input
                    id="onb_password"
                    type="password"
                    value={onboardingData.password}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={onboarding.isPending}
              >
                {onboarding.isPending ? "Creando..." : "✅ Crear Tienda + Usuario"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sección Tiendas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Tiendas ({tiendas.length})
          </CardTitle>
          <Dialog open={tiendaDialogOpen} onOpenChange={setTiendaDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tienda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Tienda</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTienda} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={newTienda.nombre}
                    onChange={(e) =>
                      setNewTienda({ ...newTienda, nombre: e.target.value })
                    }
                    placeholder="Ej: Verdulería Pedrito"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rubro">Rubro</Label>
                  <Select
                    value={newTienda.rubro}
                    onValueChange={(value) =>
                      setNewTienda({ ...newTienda, rubro: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rubro" />
                    </SelectTrigger>
                    <SelectContent>
                      {RUBROS.map((rubro) => (
                        <SelectItem key={rubro} value={rubro}>
                          {rubro}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTienda.isPending}
                >
                  {createTienda.isPending ? "Creando..." : "Crear Tienda"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingTiendas ? (
            <div className="text-center py-8">Cargando tiendas...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiendas.map((tienda) => (
                <Card key={tienda.id}>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{tienda.nombre}</h3>
                    <Badge variant="secondary" className="mb-2">
                      {tienda.rubro}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección Usuarios */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios ({usuarios.length})
          </CardTitle>
          <Dialog
            open={usuarioDialogOpen}
            onOpenChange={setUsuarioDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUsuario} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    value={newUsuario.full_name}
                    onChange={(e) =>
                      setNewUsuario({
                        ...newUsuario,
                        full_name: e.target.value,
                      })
                    }
                    placeholder="Pedrito Pérez"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="user_email">Email</Label>
                  <Input
                    id="user_email"
                    type="email"
                    value={newUsuario.email}
                    onChange={(e) =>
                      setNewUsuario({ ...newUsuario, email: e.target.value })
                    }
                    placeholder="pedrito@verduleria.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUsuario.password}
                    onChange={(e) =>
                      setNewUsuario({ ...newUsuario, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rol">Rol</Label>
                  <Select
                    value={newUsuario.rol}
                    onValueChange={(value) =>
                      setNewUsuario({ ...newUsuario, rol: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tienda">Tienda</Label>
                  <Select
                    value={newUsuario.tienda_id}
                    onValueChange={(value) =>
                      setNewUsuario({ ...newUsuario, tienda_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiendas.map((tienda) => (
                        <SelectItem key={tienda.id} value={tienda.id}>
                          {tienda.nombre} ({tienda.rubro})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createUsuario.isPending}
                >
                  {createUsuario.isPending ? "Creando..." : "Crear Usuario"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingUsuarios ? (
            <div className="text-center py-8">Cargando usuarios...</div>
          ) : (
            <div className="space-y-2">
              {usuarios.map((usuario) => {
                const tienda = tiendas.find((t) => t.id === usuario.tienda_id);
                return (
                  <Card key={usuario.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{usuario.full_name}</h3>
                        <p className="text-sm text-gray-600">{usuario.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{usuario.rol}</Badge>
                          {tienda && (
                            <Badge variant="secondary">
                              {tienda.nombre}
                            </Badge>
                          )}
                          {!usuario.is_active && (
                            <Badge variant="destructive">Inactivo</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {usuario.is_active ? (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteUsuario.mutate(usuario.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => activateUsuario.mutate(usuario.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
