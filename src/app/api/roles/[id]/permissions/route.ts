import { NextResponse } from 'next/server';
import { runQuery } from '../../../../../db/client';
import { authorizeRoleManagement, escapeSql, getRows } from '../../../../../lib/posAuth';
type Context = { params: { id: string } };

export async function GET(request: Request, { params }: Context) {
  const auth = await authorizeRoleManagement(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await runQuery(async (db) => db.sql(`SELECT p.id, p.name, p.description FROM role_permissions rp INNER JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = '${escapeSql(params.id)}' ORDER BY p.name`));
    return NextResponse.json({ success: true, permissions: getRows(result) });
  } catch (error) {
    console.error('Error consultando permisos del rol:', error);
    return NextResponse.json({ success: false, message: 'No se pudieron consultar los permisos del rol.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await authorizeRoleManagement(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    if (!Array.isArray(body?.permissionIds) || body.permissionIds.some((id: any) => typeof id !== 'string')) {
      return NextResponse.json({ success: false, message: 'Envía permissionIds como una lista de identificadores.' }, { status: 400 });
    }
    const roleResult = await runQuery(async (db) => db.sql(`SELECT id FROM roles WHERE id = '${escapeSql(params.id)}' LIMIT 1`));
    if (!getRows(roleResult).length) return NextResponse.json({ success: false, message: 'Rol no encontrado.' }, { status: 404 });
    const ids = [...new Set(body.permissionIds as string[])];
    const allResult = await runQuery(async (db) => db.sql('SELECT id FROM permissions'));
    const valid = new Set(getRows(allResult).map((p: any) => String(p.id)));
    if (ids.some((id) => !valid.has(id))) return NextResponse.json({ success: false, message: 'La lista contiene permisos inexistentes.' }, { status: 400 });

    await runQuery(async (db) => {
      await db.sql(`DELETE FROM role_permissions WHERE role_id = '${escapeSql(params.id)}'`);
      if (ids.length) {
        const values = ids.map((permissionId) => `('${escapeSql(params.id)}', '${escapeSql(permissionId)}')`).join(', ');
        await db.sql(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`);
      }
    });
    return NextResponse.json({ success: true, message: 'Permisos del rol actualizados.', permissionIds: ids });
  } catch (error) {
    console.error('Error actualizando permisos del rol:', error);
    return NextResponse.json({ success: false, message: 'No se pudieron actualizar los permisos del rol.' }, { status: 500 });
  }
}
