'use client';

import {
  FormEvent,
  useEffect,
  useState,
  ChangeEvent,
} from 'react';

import {
  Role,
  User,
  getRoles,
  getUsers,
  saveUsers,
} from '../utils/rolesManager';

const ALL_PERMISSIONS = [
  {
    key: 'view_pos',
    label: '🛒 Acceso a Caja POS',
  },
  {
    key: 'view_inventory',
    label: '📦 Ver Inventario',
  },
  {
    key: 'edit_inventory',
    label: '✏️ Modificar / Crear Inventario',
  },
  {
    key: 'view_credits',
    label: '📋 Ver Cuentas por Cobrar',
  },
  {
    key: 'view_payables',
    label: '📑 Ver Cuentas por Pagar',
  },
  {
    key: 'manage_payables',
    label: '💰 Gestionar Cuentas por Pagar',
  },
  {
    key: 'view_reports',
    label: '📊 Ver Reportes',
  },
  {
    key: 'manage_roles',
    label: '🛡️ Gestionar Roles y Personal',
  },
  {
    key: 'view_users',
    label: '👥 Ver Usuarios',
  },
  {
    key: 'view_dashboard',
    label: '🏠 Ver Dashboard',
  },
] as const;

export default function RolesManagerModule() {
  const [roles, setRoles] =
    useState<Role[]>([]);

  const [users, setUsers] =
    useState<User[]>([]);

  const [newUserName, setNewUserName] =
    useState('');

  const [
    newUserUsername,
    setNewUserUsername,
  ] = useState('');

  const [newUserRole, setNewUserRole] =
    useState('cajero');

  /**
   * ==========================================================
   * CARGAR DATOS
   * ==========================================================
   */

  useEffect(() => {
    const loadedRoles = getRoles();
    const loadedUsers = getUsers();

    setRoles(loadedRoles);
    setUsers(loadedUsers);

    if (loadedRoles.length > 0) {
      const cajeroExists =
        loadedRoles.some(
          (role) =>
            role.id === 'cajero'
        );

      setNewUserRole(
        cajeroExists
          ? 'cajero'
          : loadedRoles[0].id
      );
    }
  }, []);

  /**
   * ==========================================================
   * AGREGAR USUARIO
   * ==========================================================
   */

  const handleAddUser = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const cleanName =
      newUserName.trim();

    const cleanUsername =
      newUserUsername
        .trim()
        .toLowerCase();

    if (
      !cleanName ||
      !cleanUsername
    ) {
      alert(
        'Completa todos los campos.'
      );

      return;
    }

    const usernameExists =
      users.some(
        (user) =>
          user.username.toLowerCase() ===
          cleanUsername
      );

    if (usernameExists) {
      alert(
        'Ese nombre de usuario ya existe.'
      );

      return;
    }

    const selectedRole =
      roles.find(
        (role) =>
          role.id === newUserRole
      );

    if (!selectedRole) {
      alert(
        'Selecciona un rol válido.'
      );

      return;
    }

    const newUser: User = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),

      name: cleanName,

      username: cleanUsername,

      email: '',

      roleId: selectedRole.id,

      role: selectedRole.id,
    };

    const updatedUsers = [
      ...users,
      newUser,
    ];

    setUsers(updatedUsers);

    saveUsers(updatedUsers);

    setNewUserName('');
    setNewUserUsername('');

    alert(
      '¡Personal registrado exitosamente!'
    );
  };

  /**
   * ==========================================================
   * ELIMINAR USUARIO
   * ==========================================================
   */

  const handleDeleteUser = (
    id: string
  ) => {
    const userToDelete =
      users.find(
        (user) =>
          user.id === id
      );

    if (!userToDelete) {
      return;
    }

    if (
      userToDelete.username.toLowerCase() ===
      'admin'
    ) {
      alert(
        'El usuario administrador principal no puede eliminarse.'
      );

      return;
    }

    const confirmed =
      window.confirm(
        `¿Estás seguro de eliminar a ${userToDelete.name}?`
      );

    if (!confirmed) {
      return;
    }

    const updatedUsers =
      users.filter(
        (user) =>
          user.id !== id
      );

    setUsers(updatedUsers);

    saveUsers(updatedUsers);
  };

  /**
   * ==========================================================
   * INPUT HANDLERS
   * ==========================================================
   */

  const handleNameChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setNewUserName(
      e.target.value
    );
  };

  const handleUsernameChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setNewUserUsername(
      e.target.value
    );
  };

  const handleRoleChange = (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    setNewUserRole(
      e.target.value
    );
  };

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="space-y-6">

      {/* TÍTULO */}

      <div>
        <h2 className="text-xl font-bold mb-1 text-white">
          Módulo de Configuración de Roles y Personal
        </h2>

        <p className="text-sm text-slate-400">
          Define los niveles de acceso corporativo
          y administra el personal autorizado.
        </p>
      </div>

      {/* ROLES */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {roles.map(
          (role) => (
            <div
              key={role.id}
              className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3"
            >

              <div className="flex justify-between items-center gap-2">

                <h3 className="font-bold text-white text-base">
                  {role.name}
                </h3>

                <span className="text-xs uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  {role.id}
                </span>

              </div>

              <p className="text-xs text-slate-400">
                {role.description ||
                  'Sin descripción.'}
              </p>

              <div className="border-t border-slate-800 pt-2 space-y-1">

                <p className="text-xs font-semibold text-slate-300">
                  Permisos asignados:
                </p>

                <ul className="text-xs text-slate-400 space-y-1">

                  {role.permissions.map(
                    (permission) => {

                      const permissionObject =
                        ALL_PERMISSIONS.find(
                          (p) =>
                            p.key ===
                            permission
                        );

                      return (
                        <li
                          key={permission}
                        >
                          •{' '}
                          {permissionObject
                            ? permissionObject.label
                            : permission}
                        </li>
                      );
                    }
                  )}

                </ul>

              </div>

            </div>
          )
        )}

      </div>

      {/* REGISTRAR PERSONAL */}

      <div className="border-t border-slate-800 pt-6 mt-6">

        <h3 className="text-lg font-bold mb-3 text-white">
          Registrar Nuevo Empleado / Usuario
        </h3>

        <form
          onSubmit={handleAddUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800"
        >

          {/* NOMBRE */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Nombre Completo
            </label>

            <input
              type="text"
              placeholder="Ej. María Gómez"
              value={newUserName}
              onChange={
                handleNameChange
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />

          </div>

          {/* USUARIO */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Usuario (Login)
            </label>

            <input
              type="text"
              placeholder="Ej. mgomez"
              value={
                newUserUsername
              }
              onChange={
                handleUsernameChange
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />

          </div>

          {/* ROL */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Rol Asignado
            </label>

            <select
              value={newUserRole}
              onChange={
                handleRoleChange
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >

              {roles.map(
                (role) => (
                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name} (
                    {role.id})
                  </option>
                )
              )}

            </select>

          </div>

          {/* BOTÓN */}

          <div className="flex items-end">

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-4 rounded-lg transition-all text-sm shadow-lg shadow-cyan-500/20"
            >
              + Agregar Personal
            </button>

          </div>

        </form>

      </div>

      {/* PERSONAL REGISTRADO */}

      <div className="border-t border-slate-800 pt-6">

        <h3 className="text-lg font-bold mb-3 text-white">
          Personal Autorizado en el Sistema
        </h3>

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm text-slate-300">

            <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">

              <tr>

                <th className="p-3">
                  Nombre
                </th>

                <th className="p-3">
                  Usuario
                </th>

                <th className="p-3">
                  Rol
                </th>

                <th className="p-3 text-right">
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800">

              {users.map(
                (user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/40"
                  >

                    <td className="p-3 font-medium text-white">
                      {user.name}
                    </td>

                    <td className="p-3 font-mono text-cyan-400">
                      @{user.username}
                    </td>

                    <td className="p-3 uppercase text-xs font-semibold">

                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        {user.role}
                      </span>

                    </td>

                    <td className="p-3 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteUser(
                            user.id
                          )
                        }
                        className="text-red-400 hover:text-red-300 text-xs font-semibold px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20"
                      >
                        Eliminar
                      </button>

                    </td>

                  </tr>
                )
              )}

              {users.length === 0 && (
                <tr>

                  <td
                    colSpan={4}
                    className="p-6 text-center text-slate-500"
                  >
                    No hay usuarios
                    registrados.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
