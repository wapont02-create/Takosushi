'use client';

import React, { useState, useEffect } from 'react';

// Interfaz para los productos adaptada a la estructura de SQLite
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url: string; // URL proveniente de ImgBB almacenada en SQLite
}

export default function POSModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Simulación de carga inicial de productos desde la base de datos SQLite
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Endpoint o función que consulta tu base de datos SQLite
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  // Función para subir la imagen a ImgBB
  const uploadToImgBB = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);

    // Reemplaza 'TU_API_KEY_DE_IMGBB' con tu llave real de ImgBB
    const apiKey = 'TU_API_KEY_DE_IMGBB'; 
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        return data.data.url; // Retorna la URL pública de la imagen en la nube
      } else {
        console.error('Error en la respuesta de ImgBB:', data);
        return null;
      }
    } catch (error) {
      console.error('Error de red al subir la imagen:', error);
      return null;
    }
  };

  // Manejo de selección de archivo con previsualización local
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Guardar producto (Sube imagen a ImgBB primero, luego almacena la URL en SQLite)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = '';

    if (imageFile) {
      const uploadedUrl = await uploadToImgBB(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        alert('No se pudo subir la imagen a ImgBB. Inténtalo de nuevo.');
        setUploading(false);
        return;
      }
    }

    const newProduct = {
      name,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      category,
      image_url: imageUrl, // Se guarda la URL de ImgBB en SQLite
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();

      if (data.success) {
        alert('¡Producto guardado correctamente en SQLite!');
        setName('');
        setPrice('');
        setStock('');
        setCategory('');
        setImageFile(null);
        setPreviewUrl(null);
        fetchProducts(); // Refrescar lista
      } else {
        alert('Error al registrar en la base de datos.');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto rounded-3xl bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Gestión de Inventario y Productos</h2>
      
      {/* Formulario de Registro */}
      <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre del Producto</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Precio (USD)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Stock Inicial</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Categoría</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Imagen del Producto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {previewUrl && (
            <div className="mt-3">
              <img src={previewUrl} alt="Vista previa" className="h-32 w-32 object-cover rounded-xl border" />
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl shadow hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {uploading ? 'Subiendo imagen y guardando...' : 'Registrar Producto'}
          </button>
        </div>
      </form>

      {/* Listado de Productos */}
      <h3 className="text-xl font-bold mb-4 text-slate-800">Inventario Actual</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((prod) => (
          <div key={prod.id} className="border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              {prod.image_url ? (
                <img src={prod.image_url} alt={prod.name} className="h-40 w-full object-cover rounded-xl mb-2" />
              ) : (
                <div className="h-40 w-full bg-slate-100 rounded-xl mb-2 flex items-center justify-center text-slate-400">Sin Imagen</div>
              )}
              <h4 className="font-bold text-slate-800">{prod.name}</h4>
              <p className="text-sm text-slate-500">Categoría: {prod.category}</p>
              <p className="text-indigo-600 font-bold mt-1">${prod.price.toFixed(2)}</p>
            </div>
            <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
              <span>Stock: {prod.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
