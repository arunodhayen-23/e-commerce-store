'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { ArrowUpRight, ArrowRight, ShoppingBag, Search, Plus, Minus, Leaf, Package, LockKeyhole, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import type { Product } from '@/lib/db/schema'
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value / 100)
const fetcher = async (url: string) => { const res = await fetch(url); if (!res.ok) throw new Error('Could not load data. Please try again.'); return res.json() }
type CartItem = { product: Product; quantity: number }

export function Storefront() {
  const { data: products, error: catalogError, mutate: reload } = useSWR<Product[]>('/api/products', fetcher)
  const { data: cart = [], error: cartError, mutate } = useSWR<CartItem[]>('/api/cart', fetcher)
  const [category, setCategory] = useState('All objects')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const categories = ['All objects', ...new Set(products?.map(p => p.category) ?? [])]
  const shown = (products ?? []).filter(p => (category === 'All objects' || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === 'low' ? a.price-b.price : sort === 'high' ? b.price-a.price : 0)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const total = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0)
  async function update(productId: string, quantity: number, action = 'set') {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity, action }) })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      await mutate(result, false)
      if (action === 'add') { setDetail(null); setOpen(true) }
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update bag.') }
    finally { setBusy(false) }
  }
  return <>
    <div className="announcement">A little less ordinary. A little more considered. <span>Discover the collection <ArrowRight size={12}/></span></div>
    <header className="store-header">
      <a href="/" className="wordmark" aria-label="Form and Field home">FORM <span>&</span> FIELD<span className="brand-dot">®</span></a>
      <nav aria-label="Main navigation"><a className="active" href="#collection">Shop all</a><a href="#collection" onClick={() => setCategory('Home & living')}>Home & living</a><a href="#story">Our philosophy</a></nav>
      <button className="bag-button" onClick={() => setOpen(true)}><ShoppingBag size={18}/><span>Bag</span><span className="bag-count">{count}</span></button>
    </header>
    <main>
      <section className="hero">
        <Image src="/images/studio.png" alt="Sunlit room with a sculptural ceramic vase, walnut side table, and linen chair" fill priority sizes="100vw" className="hero-image"/>
        <div className="hero-copy"><p className="eyebrow">THE EVERYDAY, ELEVATED</p><h1>Good things.<br/><em>Simple living.</em></h1><p>Thoughtfully chosen objects for your home,<br className="desktop-break"/> your rituals, and everything in between.</p><a className="shop-link" href="#collection">Explore the collection <ArrowUpRight size={19}/></a></div>
        <div className="hero-caption"><span>OBJECTS WITH INTENTION</span><span>Collection No. 01 — 2026</span></div>
      </section>
      <div className="principles"><span><Leaf/> Thoughtfully selected</span><span><Package/> Made for the everyday</span><span><ShoppingBag/> A more considered collection</span></div>
      <section className="collection" id="collection">
        <div className="collection-heading"><div><p className="eyebrow">LESS, BUT BETTER</p><h2>Your everyday favorites.</h2></div><span className="collection-note">Small details. Lasting impressions.</span></div>
        <div className="catalog-toolbar"><div className="category-tabs" role="group" aria-label="Product categories">{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="catalog-controls"><label className="search"><Search size={15}/><input aria-label="Search products" placeholder="Find your next favorite" value={search} onChange={e => setSearch(e.target.value)}/></label><label className="sort"><SlidersHorizontal size={15}/><select aria-label="Sort products" value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div></div>
        <div className="results-line"><span>{products ? `${shown.length} considered objects` : 'Loading the collection…'}</span><span>Designed to be kept.</span></div>
        {catalogError ? <div className="empty-state"><p>The collection is temporarily unavailable.</p><Button onClick={() => reload()}>Try again</Button></div> : <div className="product-grid">{shown.map((p, i) => <article key={p.id} className="product-card"><div className="product-image"><button className="image-button" onClick={() => setDetail(p)} aria-label={`View ${p.name}`}><Image src={p.image} alt={p.name} fill sizes="(max-width: 600px) 50vw, 25vw"/></button>{i === 0 && <span className="product-label">THE ESSENTIALS</span>}<button className="quick-add" aria-label={`Add ${p.name} to bag`} disabled={busy || p.stock === 0} onClick={() => update(p.id, 1, 'add')}><Plus size={18}/></button></div><div className="product-meta"><div><p>{p.category}</p><button onClick={() => setDetail(p)}>{p.name}</button></div><span>{money(p.price)}</span></div></article>)}</div>}
        {products && !shown.length && <div className="empty-state"><Search/><h3>No objects found</h3><p>Try another search or category.</p><Button variant="outline" onClick={() => { setSearch(''); setCategory('All objects') }}>Reset filters</Button></div>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>
      <section className="story" id="story"><p className="eyebrow">THE FORM & FIELD PHILOSOPHY</p><h2>Less noise.<br/><em>More meaning.</em></h2><div><p>We believe the things you surround yourself with should earn their place. Useful, beautiful, and a little bit special. Nothing more. Nothing less.</p><span>Considered objects. Everyday joy. <ArrowUpRight size={18}/></span></div></section>
    </main>
    <footer><a className="wordmark" href="/">FORM <span>&</span> FIELD</a><p>© 2026 Form & Field · Coursework storefront</p><span>Catalog & guest bag live · Checkout coming soon</span></footer>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent><SheetHeader><SheetTitle>Your bag ({count})</SheetTitle><SheetDescription>A few good things, saved for later.</SheetDescription></SheetHeader><div className="cart-content">{cartError && <p role="alert">Could not load your bag. Please refresh.</p>}{!cart.length && !cartError && <div className="empty-state"><ShoppingBag size={32}/><h3>Room for something good.</h3><p>Your bag is waiting for your everyday favorites.</p><Button onClick={() => setOpen(false)}>Explore the collection</Button></div>}{cart.map(({ product: p, quantity }) => <div className="cart-item" key={p.id}><Image src={p.image} alt={p.name} width={80} height={96}/><div><h3>{p.name}</h3><p>{money(p.price)}</p><div className="quantity"><Button variant="outline" size="icon-sm" disabled={busy} aria-label={`Decrease ${p.name} quantity`} onClick={() => update(p.id, quantity-1)}><Minus/></Button><span>{quantity}</span><Button variant="outline" size="icon-sm" disabled={busy || quantity >= Math.min(p.stock, 20)} aria-label={`Increase ${p.name} quantity`} onClick={() => update(p.id, quantity+1)}><Plus/></Button><button className="remove" disabled={busy} onClick={() => update(p.id, 0)}>Remove</button></div></div></div>)}{error && <p role="alert">{error}</p>}</div><SheetFooter><div className="subtotal"><span>Subtotal</span><strong>{money(total)}</strong></div><p className="cart-note">Your guest bag is saved in the database for this browser.</p><Button disabled><LockKeyhole data-icon="inline-start"/>Checkout — coming soon</Button><p className="cart-note">Login and protected checkout are pending setup. No orders or payments can be placed yet.</p></SheetFooter></SheetContent></Sheet>
    <Sheet open={!!detail} onOpenChange={value => { if (!value) setDetail(null) }}><SheetContent><SheetHeader><SheetTitle>{detail?.name}</SheetTitle><SheetDescription>{detail?.category}</SheetDescription></SheetHeader>{detail && <div className="detail-content"><Image src={detail.image} alt={detail.name} width={500} height={500}/><h3>{money(detail.price)}</h3><p>{detail.description}</p><p className="cart-note">{detail.stock} available · Maximum 20 per bag</p>{error && <p role="alert">{error}</p>}<Button disabled={busy || !detail.stock} onClick={() => update(detail.id,1,'add')}><Plus data-icon="inline-start"/>Add to bag</Button></div>}</SheetContent></Sheet>
  </>
}
