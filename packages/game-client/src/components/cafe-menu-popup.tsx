'use client'

import { useState } from 'react'
import { X, Coffee, Leaf, Cookie, Star, Sparkles, Plus, Minus, ShoppingBag, ChevronRight, Printer, Wifi } from 'lucide-react'

// ============ TYPES & INTERFACES ============
type MenuView = 'menu' | 'cart' | 'receipt'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: 'coffee' | 'tea' | 'snacks'
  popular?: boolean
  isNew?: boolean
}

interface CartItem extends MenuItem {
  qty: number
}

// ============ DATA & HELPERS ============
const menuItems: MenuItem[] = [
  { id: 'esp',  name: 'Espresso',         description: 'Rich and bold single shot',        price: 18000, category: 'coffee' },
  { id: 'ame',  name: 'Americano',         description: 'Espresso with hot water',           price: 22000, category: 'coffee', popular: true },
  { id: 'lat',  name: 'Cafe Latte',        description: 'Espresso with steamed milk',        price: 28000, category: 'coffee', popular: true },
  { id: 'cap',  name: 'Cappuccino',        description: 'Espresso, steamed milk, foam',      price: 28000, category: 'coffee' },
  { id: 'moc',  name: 'Mocha',             description: 'Espresso, chocolate, milk',         price: 32000, category: 'coffee', isNew: true },
  { id: 'cmac', name: 'Caramel Macchiato', description: 'Vanilla, milk, espresso, caramel', price: 35000, category: 'coffee', popular: true },
  { id: 'gre',  name: 'Green Tea',         description: 'Classic Japanese green tea',        price: 18000, category: 'tea' },
  { id: 'cha',  name: 'Chai Latte',        description: 'Spiced tea with steamed milk',      price: 25000, category: 'tea' },
  { id: 'mat',  name: 'Matcha Latte',      description: 'Premium matcha with milk',          price: 30000, category: 'tea', isNew: true },
  { id: 'ear',  name: 'Earl Grey',         description: 'Black tea with bergamot',           price: 18000, category: 'tea' },
  { id: 'cro',  name: 'Butter Croissant',  description: 'Flaky, buttery pastry',            price: 20000, category: 'snacks', popular: true },
  { id: 'muf',  name: 'Blueberry Muffin',  description: 'Fresh-baked with real berries',    price: 22000, category: 'snacks' },
  { id: 'cke',  name: 'Chocolate Cake',    description: 'Rich dark chocolate slice',        price: 28000, category: 'snacks' },
  { id: 'coo',  name: 'Cookies (3 pcs)',   description: 'Assorted homemade cookies',        price: 15000, category: 'snacks' },
]

const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const pad = (n: number, len = 2) => String(n).padStart(len, '0')
const receiptTime = () => {
  const d = new Date()
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const orderNum = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`

// ============ KOMPONEN: ReceiptView ============
interface ReceiptViewProps {
  cart: CartItem[]
  onClose: () => void
}

const ReceiptView: React.FC<ReceiptViewProps> = ({ cart, onClose }) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax
  const time = receiptTime()
  const order = orderNum()

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-md">
      <div className="relative animate-in zoom-in-95 duration-300">
        {/* Warm glow behind receipt */}
        <div className="absolute inset-0 bg-amber-600/10 blur-3xl pointer-events-none" />

        {/* Receipt paper */}
        <div
          className="relative w-72 flex flex-col overflow-hidden shadow-2xl"
          style={{ background: '#fdf8ef', fontFamily: 'monospace' }}
        >
          {/* Jagged top edge */}
          <div
            className="w-full h-3 flex-shrink-0"
            style={{
              background: '#fdf8ef',
              clipPath: 'polygon(0% 100%, 3% 0%, 6% 100%, 9% 0%, 12% 100%, 15% 0%, 18% 100%, 21% 0%, 24% 100%, 27% 0%, 30% 100%, 33% 0%, 36% 100%, 39% 0%, 42% 100%, 45% 0%, 48% 100%, 51% 0%, 54% 100%, 57% 0%, 60% 100%, 63% 0%, 66% 100%, 69% 0%, 72% 100%, 75% 0%, 78% 100%, 81% 0%, 84% 100%, 87% 0%, 90% 100%, 93% 0%, 96% 100%, 100% 0%, 100% 100%)',
            }}
          />

          {/* Receipt body */}
          <div className="px-5 pb-2 flex flex-col gap-0" style={{ color: '#2a1a00' }}>
            {/* Header */}
            <div className="text-center py-2 border-b border-stone-300">
              <div className="text-[12px] font-bold tracking-wider">CAFE PIXEL</div>
              <div className="text-[9px] text-stone-600">Jl. Pixel Street No. 123</div>
              <div className="text-[9px] text-stone-600">(021) 1234-5678</div>
            </div>

            {/* Divider */}
            <div className="text-[10px] text-stone-400 text-center tracking-widest py-1">
              --------------------------------
            </div>

            {/* Order info */}
            <div className="text-[10px] space-y-0.5 py-1">
              <div className="flex justify-between">
                <span className="text-stone-600">No. Order</span>
                <span className="font-semibold">{order}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Tanggal</span>
                <span className="font-semibold">{time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Kasir</span>
                <span className="font-semibold">Mira</span>
              </div>
            </div>

            {/* Divider */}
            <div className="text-[10px] text-stone-400 text-center tracking-widest py-1">
              --------------------------------
            </div>

            {/* Items list */}
            <div className="text-[10px] space-y-1 py-1">
              {cart.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{item.qty}x</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span className="text-[9px]">{formatIDR(item.price)}</span>
                    <span className="font-semibold">{formatIDR(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="text-[10px] text-stone-400 text-center tracking-widest py-1">
              --------------------------------
            </div>

            {/* Totals */}
            <div className="text-[10px] space-y-0.5 py-1">
              <div className="flex justify-between text-stone-700">
                <span>Subtotal</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Pajak 10%</span>
                <span>{formatIDR(tax)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="text-[10px] text-stone-400 text-center tracking-widest py-1">
              --------------------------------
            </div>

            {/* TOTAL */}
            <div className="flex justify-between text-[13px] font-bold py-1.5">
              <span>TOTAL</span>
              <span>{formatIDR(total)}</span>
            </div>

            {/* Payment */}
            <div className="text-[10px] py-1">
              <div className="flex justify-between">
                <span className="text-stone-600">Pembayaran</span>
                <span className="font-semibold">TUNAI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Kembali</span>
                <span className="font-semibold">{formatIDR(0)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="text-[10px] text-stone-400 text-center tracking-widest py-1">
              --------------------------------
            </div>

            {/* WiFi Info */}
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wifi className="w-3 h-3 text-stone-600 flex-shrink-0" />
                <p className="text-[10px] font-bold text-stone-700 tracking-wide">INFO WIFI GRATIS</p>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-500">Jaringan</span>
                <span className="font-semibold">CafeCorner</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-500">Password</span>
                <span className="font-bold tracking-wide">haruspesanduluya</span>
              </div>
            </div>

            {/* Divider */}
            <div className="text-[10px] text-stone-400 text-center tracking-widest py-1">
              --------------------------------
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-stone-600 py-1">
              <p>Terima kasih telah berkunjung!</p>
              <p>Nikmati WiFi gratis kami 😊</p>
            </div>
          </div>

          {/* Jagged bottom edge */}
          <div
            className="w-full h-3 flex-shrink-0"
            style={{
              background: '#fdf8ef',
              clipPath: 'polygon(0% 0%, 3% 100%, 6% 0%, 9% 100%, 12% 0%, 15% 100%, 18% 0%, 21% 100%, 24% 0%, 27% 100%, 30% 0%, 33% 100%, 36% 0%, 39% 100%, 42% 0%, 45% 100%, 48% 0%, 51% 100%, 54% 0%, 57% 100%, 60% 0%, 63% 100%, 66% 0%, 69% 100%, 72% 0%, 75% 100%, 78% 0%, 81% 100%, 84% 0%, 87% 100%, 90% 0%, 93% 100%, 96% 0%, 100% 100%, 100% 0%)',
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-amber-600/50 bg-amber-900/90 hover:bg-amber-800 transition-colors flex items-center justify-center z-10"
        >
          <X className="w-4 h-4 text-amber-300" />
        </button>
      </div>
    </div>
  )
}

// ============ KOMPONEN: CartView ============
interface CartViewProps {
  cart: CartItem[]
  onUpdateQty: (id: string, delta: number) => void
  onBack: () => void
  onCheckout: () => void
}

const CartView: React.FC<CartViewProps> = ({ cart, onUpdateQty, onBack, onCheckout }) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <div
      className="relative flex flex-col w-[420px] max-h-[520px] overflow-hidden rounded-xl border-4 border-amber-800/60 shadow-2xl"
      style={{ background: 'linear-gradient(180deg, hsl(30 40% 18%) 0%, hsl(25 35% 14%) 100%)' }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-amber-800/40">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center border border-amber-700/40 hover:border-amber-500/60 hover:bg-amber-800/30 transition-all rounded"
        >
          <ChevronRight className="w-4 h-4 text-amber-400 rotate-180" />
        </button>
        <h2 className="font-pixel text-sm text-amber-300">KERANJANG</h2>
        <div className="w-7" />
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-amber-400/60">Keranjang kosong</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border border-amber-800/40 bg-amber-900/20 rounded-lg">
              {/* Kiri: nama + harga per item */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-amber-200 truncate">{item.name}</div>
                <div className="text-[10px] text-amber-400/70">{formatIDR(item.price)}</div>
              </div>

              {/* Tengah: qty controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="w-6 h-6 flex items-center justify-center border border-amber-700/50 hover:bg-amber-700/40 hover:border-amber-500/60 transition-all rounded"
                >
                  <Minus className="w-3 h-3 text-amber-300" />
                </button>
                <span className="font-pixel text-xs text-amber-200 w-5 text-center">{item.qty}</span>
                <button
                  onClick={() => onUpdateQty(item.id, +1)}
                  className="w-6 h-6 flex items-center justify-center border border-amber-700/50 hover:bg-amber-700/40 hover:border-amber-500/60 transition-all rounded"
                >
                  <Plus className="w-3 h-3 text-amber-300" />
                </button>
              </div>

              {/* Kanan: total harga item */}
              <div className="w-20 text-right">
                <div className="text-xs font-bold text-amber-200">{formatIDR(item.price * item.qty)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-amber-800/30" />

      {/* Subtotal */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-amber-300/70">Subtotal</span>
          <span className="font-semibold text-amber-200">{formatIDR(subtotal)}</span>
        </div>

        {/* Checkout button */}
        <button
          disabled={cart.length === 0}
          onClick={onCheckout}
          className="w-full mt-1 py-3 font-pixel text-xs border-2 border-amber-500/60 text-amber-200 bg-amber-700/30 hover:bg-amber-600/40 hover:border-amber-400/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 rounded"
        >
          <Printer className="w-4 h-4" />
          BAYAR &amp; CETAK STRUK
        </button>
      </div>
    </div>
  )
}

// ============ KOMPONEN: MenuView ============
interface MenuViewProps {
  cart: CartItem[]
  onAddToCart: (item: MenuItem) => void
  onGoToCart: () => void
}

const MenuView: React.FC<MenuViewProps> = ({ cart, onAddToCart, onGoToCart }) => {
  const [activeCategory, setActiveCategory] = useState<'coffee' | 'tea' | 'snacks'>('coffee')
  const totalQty = cart.reduce((s, i) => s + i.qty, 0)
  const filteredItems = menuItems.filter((i) => i.category === activeCategory)

  const categories = [
    { id: 'coffee' as const, label: 'Coffee', icon: Coffee },
    { id: 'tea' as const, label: 'Tea', icon: Leaf },
    { id: 'snacks' as const, label: 'Snacks', icon: Cookie },
  ]

  return (
    <div
      className="relative flex flex-col w-[420px] max-h-[520px] overflow-hidden rounded-xl border-4 border-amber-800/60 shadow-2xl"
      style={{ background: 'linear-gradient(180deg, hsl(30 40% 18%) 0%, hsl(25 35% 14%) 100%)' }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

      {/* Decorative corners */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-600/50" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-600/50" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-amber-800/40">
        <h2 className="font-pixel text-sm text-amber-300">MENU</h2>
        <button
          onClick={onGoToCart}
          className="relative flex items-center gap-1.5 px-3 py-1.5 border border-amber-700/50 hover:border-amber-500/60 hover:bg-amber-800/30 transition-all rounded-lg"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span className="font-pixel text-[10px] text-amber-300">KERANJANG</span>
          {totalQty > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center font-pixel text-[9px] text-amber-950">
              {totalQty}
            </span>
          )}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 p-3 border-b border-amber-800/40 overflow-x-auto">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap font-pixel text-xs ${
              activeCategory === id
                ? 'bg-amber-700/30 text-amber-200 border-b-2 border-amber-500'
                : 'text-amber-400/60 hover:bg-amber-800/20 hover:text-amber-300/80'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredItems.map((item) => {
          const inCart = cart.find((c) => c.id === item.id)

          return (
            <div
              key={item.id}
              className="p-3 border border-amber-800/40 bg-amber-900/20 rounded-lg space-y-1.5"
            >
              {/* Item header dengan badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-amber-200">{item.name}</div>
                  <div className="text-[10px] text-amber-400/70">{item.description}</div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-1.5 flex-wrap">
                {item.popular && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded text-[7px] text-amber-400 font-pixel">
                    <Star className="w-2 h-2" />
                    POPULAR
                  </span>
                )}
                {item.isNew && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-[7px] text-emerald-400 font-pixel">
                    <Sparkles className="w-2 h-2" />
                    NEW
                  </span>
                )}
              </div>

              {/* Price + add button */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-200">{formatIDR(item.price)}</span>
                <button
                  onClick={() => onAddToCart(item)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-pixel transition-all ${
                    inCart
                      ? 'border-amber-500/60 bg-amber-600/30 text-amber-200'
                      : 'border-amber-700/50 text-amber-400 hover:border-amber-500/60 hover:bg-amber-700/30 hover:text-amber-200'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  {inCart ? `x${inCart.qty}` : 'TAMBAH'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom glow line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
    </div>
  )
}

// ============ MAIN EXPORT: CafeMenuPopup ============
interface CafeMenuPopupProps {
  onClose: () => void
  onReceiptShown?: (cartData?: CartItem[]) => void
  receiptOnly?: boolean
  cartData?: CartItem[]
}

export const CafeMenuPopup: React.FC<CafeMenuPopupProps> = ({ onClose, onReceiptShown, receiptOnly = false, cartData = [] }) => {
  const [view, setView] = useState<MenuView>(receiptOnly ? 'receipt' : 'menu')
  const [cart, setCart] = useState<CartItem[]>(receiptOnly ? cartData : [])

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const handleUpdateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
      return updated.filter((c) => c.qty > 0)
    })
  }

  const handleCheckout = () => {
    setView('receipt')
    onReceiptShown?.(cart)
  }

  // Receipt punya overlay sendiri
  if (view === 'receipt') {
    return <ReceiptView cart={cart} onClose={onClose} />
  }

  // Menu dan Cart di dalam satu overlay
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-md">
      <div className="relative animate-in zoom-in-95 duration-300">
        {/* Warm glow */}
        <div className="absolute inset-0 bg-amber-600/10 blur-3xl pointer-events-none" />

        {view === 'menu' && (
          <MenuView
            cart={cart}
            onAddToCart={handleAddToCart}
            onGoToCart={() => setView('cart')}
          />
        )}

        {view === 'cart' && (
          <CartView
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onBack={() => setView('menu')}
            onCheckout={handleCheckout}
          />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-amber-600/50 bg-amber-900/90 hover:bg-amber-800 transition-colors flex items-center justify-center z-10"
        >
          <X className="w-4 h-4 text-amber-300" />
        </button>
      </div>
    </div>
  )
}
