                  {
                    lastPrintedSale.date
                  }
                </div>

                <div>
                  Cliente:{' '}
                  {lastPrintedSale.clientName ||
                    'Cliente Genérico'}
                </div>

                <div>
                  Caja: #
                  {lastPrintedSale.cashRegisterId ||
                    '—'}
                </div>

                <div className="border-b border-dashed border-black my-2" />

                {lastPrintedSale.items.map(
                  (
                    item: CartItem
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      className="flex justify-between gap-2"
                    >
                      <span>
                        {item.quantity}{' '}
                        x{' '}
                        {
                          item.name
                        }
                      </span>

                      <span>
                        $
                        {(
                          item.quantity *
                          item.price
                        ).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  )
                )}

                <div className="border-b border-dashed border-black my-2" />

                <div className="flex justify-between">
                  <span>
                    Subtotal
                  </span>

                  <b>
                    $
                    {lastPrintedSale.subtotalUSD.toFixed(
                      2
                    )}
                  </b>
                </div>

                <div className="flex justify-between">
                  <span>
                    IVA
                  </span>

                  <b>
                    $
                    {lastPrintedSale.ivaUSD.toFixed(
                      2
                    )}
                  </b>
                </div>

                <div className="flex justify-between text-sm">
                  <span>
                    Total
                  </span>

                  <b>
                    $
                    {lastPrintedSale.totalUSD.toFixed(
                      2
                    )}
                  </b>
                </div>

                <div className="flex justify-between">
                  <span>
                    Bs.
                  </span>

                  <b>
                    {lastPrintedSale.totalBs.toFixed(
                      2
                    )}
                  </b>
                </div>

                <div className="mt-3 text-center">
                  ¡Gracias por su compra!
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
