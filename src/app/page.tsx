import { Database } from '@sqlitecloud/drivers';
import ClientMenu from '@/components/ClientMenu'; // Componente cliente para el carrito y WhatsApp

// Función para obtener los productos directamente de SQLite Cloud
async function getProducts() {
  try {
    const connectionString = process.env.SQLITECLOUD_CONNECTION_STRING;
    if (!connectionString) return [];

    const db = new Database(connectionString);
    const result = await db.sql('SELECT id, name, description, price_usd, category FROM products;');
    
    // SQLite Cloud puede retornar un array de filas directamente o envuelto
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error al cargar productos desde la BD:', error);
    return [];
  }
}

export default async function TakosushiMenuPage() {
  const products = await getProducts();

  // Organizar los productos por categorías
  const categoriesMap: { [key: string]: any[] } = {};
  
  products.forEach((prod: any) => {
    const cat = prod.category || 'VARIOS';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push({
      id: prod.id,
      name: prod.name,
      description: prod.description || '',
      price: prod.price_usd || 0
    });
  });

  const menuCategories = Object.keys(categoriesMap).map(cat => ({
    category: cat,
    items: categoriesMap[cat]
  }));

  return (
    <main className="min-h-screen bg-[#140005] text-white flex flex-col justify-between selection:bg-[#ff007f] selection:text-white pb-24">
      {/* Pasamos los productos dinámicos al componente interactivo del carrito */}
      <ClientMenu initialCategories={menuCategories} />
    </main>
  );
}
