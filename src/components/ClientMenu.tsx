const checkoutWhatsApp = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor ingresa tu Nombre y Teléfono de contacto.');
      return;
    }

    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      alert('Por favor ingresa la dirección exacta para el delivery.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Esperamos obligatoriamente a que la API responda y guarde en SQLite Cloud
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          orderType: `${orderType} ${orderType === 'Delivery' ? `(${deliveryZone})` : ''}`,
          items: cart,
          total: parseFloat(totalPrice),
          totalBs: parseFloat(totalBs),
          exchangeRate,
          paymentMethod
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar en el sistema');
      }

      console.log('Pedido guardado con éxito en la BD:', data);

    } catch (error: any) {
      console.error('Error al registrar pedido:', error);
      alert('Hubo un problema al registrar en la base de datos: ' + error.message);
      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }

    // 2. Una vez guardado con éxito en la BD, procedemos a abrir el WhatsApp
    const phone = "584143065287"; 
    let message = `🍣 *NUEVO PEDIDO - TAKOSUSHI* 🍣\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📞 *Teléfono:* ${customerPhone}\n`;
    message += `📍 *Servicio:* ${orderType} ${orderType === 'Delivery' ? `(${deliveryZone})` : ''}\n`;
    
    if (orderType === 'Delivery') {
      message += `🏠 *Dirección:* ${deliveryAddress}\n`;
    }

    message += `💳 *Pago:* ${paymentMethod}\n`;
    message += `-----------------------------------\n`;
    
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });

    message += `-----------------------------------\n`;
    if (orderType === 'Delivery') {
      message += `🛵 *Delivery:* $${deliveryCost.toFixed(2)}\n`;
    }
    message += `💵 *TOTAL USD:* $${totalPrice}\n`;
    message += `🇻🇪 *TOTAL BS (Tasa ${exchangeRate}):* Bs. ${totalBs}`;

    const encodedURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(encodedURL, '_blank');
  };
