import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

const emptyListing = { title: '', address: '', city: '', province: '', rent: '', bedrooms: 1, bathrooms: 1, property_type: 'Apartment', description: '', image: '', lat: '', lon: '', active: true };
const money = value => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
const imageUrls = property => [...new Set([property.image, ...(Array.isArray(property.images) ? property.images : [])]
  .filter(url => typeof url === 'string' && /^https?:\/\//i.test(url)))];
const listText = value => Array.isArray(value) ? value.filter(Boolean).join(', ') : (typeof value === 'string' ? value : '');

const locationInsightsKey = property => [property.id, property.address, property.city, property.province]
  .map(value => String(value ?? '').trim().toLowerCase())
  .join('|');

function LocationInsights({ result, onRetry }) {
  const heading = <h3 id="location-insights-title">Location Insights</h3>;
  if (result.status === 'loading') return <section className="notice" aria-labelledby="location-insights-title" aria-live="polite">{heading}<p>Analyzing area information…</p></section>;
  if (result.status === 'error') return <section className="notice error" aria-labelledby="location-insights-title" role="alert">{heading}<p>{result.error}</p><button onClick={onRetry}>Try again</button></section>;

  const insights = result.data;
  if (result.status === 'unavailable') return <section className="notice" aria-labelledby="location-insights-title">{heading}<p><strong>Detailed location insights unavailable</strong></p><p>{insights.ai_summary}</p>{insights.location?.display_name && <p className="muted">Available location: {insights.location.display_name}</p>}</section>;

  const amenityGroups = [
    ['Grocery', insights.amenities?.grocery],
    ['Healthcare', insights.amenities?.healthcare],
    ['Transit stops', insights.amenities?.transit_stops],
    ['Schools', insights.amenities?.schools],
  ].map(([label, items]) => [label, Array.isArray(items) ? items.filter(item => item?.name) : []]).filter(([, items]) => items.length);
  const amenityText = item => `${item.name}${Number.isFinite(Number(item.distance_m)) ? ` (${Math.round(Number(item.distance_m))} m)` : ''}`;

  return <section className="notice" aria-labelledby="location-insights-title">
    {heading}
    <h4>Area</h4><p>{insights.location?.display_name || 'Location details unavailable'}</p>
    <h4>Safety Insights</h4><p>{insights.safety?.summary || 'Detailed safety data is not available for this listing.'}</p>
    {insights.safety?.source_note && <p className="muted"><small>{insights.safety.source_note}</small></p>}
    <h4>Transit</h4><p>{insights.transit?.summary || 'Transit information is unavailable.'}</p>
    <h4>Nearby essentials</h4>{amenityGroups.length ? <ul>{amenityGroups.map(([label, items]) => <li key={label}><strong>{label}:</strong> {items.map(amenityText).join(', ')}</li>)}</ul> : <p>Nearby amenity information is unavailable.</p>}
    <h4>Student perspective</h4><p>{insights.student_fit?.summary || 'Student-location insights are unavailable.'}</p>
    <h4>AI summary</h4><p>{insights.ai_summary}</p>
    {Array.isArray(insights.limitations) && insights.limitations.length > 0 && <><h4>Data limitations</h4><ul>{insights.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}</ul></>}
  </section>;
}

export function PropertyImage({ property }) {
  const sources = imageUrls(property);
  const sourceKey = sources.join('|');
  const [imageIndex, setImageIndex] = useState(0);
  useEffect(() => setImageIndex(0), [sourceKey]);
  const imageUrl = sources[imageIndex];
  return imageUrl ? <img className="rental-image" src={imageUrl} alt={property.title} loading="lazy" onError={() => setImageIndex(index => index + 1)} /> : <div className="rental-placeholder" aria-label="No photo available"><span>⌂</span><small>No photo available</small></div>;
}

function PropertySnapshot({ property }) {
  const details = [
    ['Bedrooms', property.bedrooms == null ? '' : property.bedrooms === 0 ? 'Studio' : property.bedrooms],
    ['Bathrooms', property.bathrooms == null ? '' : property.bathrooms],
    ['Square footage', property.square_feet ? `${property.square_feet} sq ft` : ''],
    ['Property type', property.property_type], ['Parking', property.parking], ['Pets', property.pets],
    ['Lease term', property.lease_term], ['Available', property.available_date],
    ['Utilities', listText(property.utilities)], ['Appliances', listText(property.appliances)], ['Features', listText(property.features)],
  ].filter(([, value]) => value !== '' && value != null);
  if (!details.length && !property.imported) return null;
  return <section className="property-snapshot" aria-label="Property details"><h3>Property details</h3>
    {details.length ? <dl>{details.map(([label, value]) => <React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}</dl> : <p>Additional property details were not supplied.</p>}
  </section>;
}

function PropertyGallery({ property }) {
  const gallery = imageUrls(property).slice(1);
  return <><PropertyImage property={property} />
    {gallery.length > 0 && <div className="property-gallery" aria-label="Property image gallery">{gallery.map((url, index) => <img key={url} src={url} alt={`${property.title} ${index + 2}`} loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />)}</div>}
  </>;
}
export default function BrowseProperties({ mode, userProfile, onBack, onNavigate, onContact }) {
  const mine = mode === 'my-properties';
  const savedOnly = mode === 'saved-properties';
  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(24);
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const locationInsightsCache = useRef(new Map());
  const [locationInsights, setLocationInsights] = useState({ key: '', status: 'idle' });
  const [locationInsightsRequest, setLocationInsightsRequest] = useState(0);
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const [all, saved] = await Promise.all([api.getProperties(mine), api.getSavedProperties()]);
      setProperties(savedOnly ? saved.properties : all.properties); setSavedIds(saved.properties.map(p => p.id));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [mine, savedOnly]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const escape = e => { if (e.key === 'Escape' && !busy) { setSelected(null); setEdit(null); setDeleting(null); } };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [busy]);
  useEffect(() => {
    if (!selected) return undefined;
    const key = locationInsightsKey(selected);
    const cached = locationInsightsCache.current.get(key);
    if (cached) {
      setLocationInsights({ key, ...cached });
      return undefined;
    }

    let active = true;
    setLocationInsights({ key, status: 'loading' });
    api.analyzeLocationInsights(selected.id).then(response => {
      if (!response?.insights || typeof response.insights !== 'object') throw new Error('Location insights returned an incomplete response.');
      const result = {
        status: response.insights.location?.scope === 'detailed' && !response.insights.data_quality?.insufficient_evidence ? 'success' : 'unavailable',
        data: response.insights,
      };
      locationInsightsCache.current.set(key, result);
      if (active) setLocationInsights({ key, ...result });
    }).catch(requestError => {
      if (active) setLocationInsights({ key, status: 'error', error: requestError.message || 'Location insights are temporarily unavailable. Please try again.' });
    });
    return () => { active = false; };
  }, [selected, locationInsightsRequest]);
  const filtered = useMemo(() => properties.filter(p =>
    (!query || (p.title + ' ' + p.address).toLowerCase().includes(query.toLowerCase())) &&
    (!city || p.city === city) && (!maxRent || p.rent <= Number(maxRent)) &&
    (bedrooms === '' || (bedrooms === '4' ? p.bedrooms >= 4 : p.bedrooms === Number(bedrooms))) &&
    (!type || p.property_type === type)).sort((a, b) => sort === 'low' ? a.rent - b.rent : sort === 'high' ? b.rent - a.rent : b.id - a.id),
    [properties, query, city, maxRent, bedrooms, type, sort]);
  useEffect(() => { setVisibleCount(24); }, [query, city, maxRent, bedrooms, type, sort]);
  const visibleProperties = filtered.slice(0, visibleCount);
  const selectedLocationKey = selected ? locationInsightsKey(selected) : '';
  const selectedLocationInsights = selected && (locationInsightsCache.current.get(selectedLocationKey) || (locationInsights.key === selectedLocationKey ? locationInsights : { status: 'loading' }));
  const retryLocationInsights = () => {
    if (!selected) return;
    const key = locationInsightsKey(selected);
    locationInsightsCache.current.delete(key);
    setLocationInsights({ key, status: 'loading' });
    setLocationInsightsRequest(request => request + 1);
  };
  const toggleSave = async p => {
    setBusy(true); setError('');
    try {
      if (savedIds.includes(p.id)) { await api.unsaveProperty(p.id); setSavedIds(ids => ids.filter(id => id !== p.id)); if (savedOnly) { setProperties(items => items.filter(item => item.id !== p.id)); setSelected(null); } }
      else { await api.saveProperty(p.id); setSavedIds(ids => [...ids, p.id]); }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const contact = async p => {
    setBusy(true); setError('');
    try { await onContact(p.owner_id); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const submitListing = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const data = { ...edit, rent: Number(edit.rent), bedrooms: Number(edit.bedrooms), bathrooms: Number(edit.bathrooms) };
      if (edit.id) await api.updateProperty(edit.id, data); else await api.createProperty(data);
      setEdit(null); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const deleteListing = async () => {
    setBusy(true); setError('');
    try { await api.deleteProperty(deleting.id); setDeleting(null); setSelected(null); await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const actions = p => <div className="action-row">
    {!mine && <button disabled={busy || (!p.active && !savedIds.includes(p.id))} aria-pressed={savedIds.includes(p.id)} onClick={() => toggleSave(p)}>{savedIds.includes(p.id) ? '♥ Saved' : '♡ Save'}</button>}
    {p.owner_id === userProfile.id ? <><button onClick={() => { setSelected(null); setEdit({ ...p, lat: p.lat ?? '', lon: p.lon ?? '' }); }}>Edit</button><button className="danger" onClick={() => { setSelected(null); setDeleting(p); }}>Delete</button></> :
      p.owner_id ? <button disabled={busy || !p.active} onClick={() => contact(p)}>Message landlord</button> :
      p.url ? <a className="button-link" href={p.url} target="_blank" rel="noopener noreferrer">View source listing ↗</a> : null}
  </div>;
  return <main className="workspace">
    <header className="page-heading"><div><p className="eyebrow">FIND YOUR PLACE</p><h1>{mine ? 'My properties' : savedOnly ? 'Saved properties' : 'Browse properties'}</h1><p>{mine ? 'Create and manage your rental listings.' : savedOnly ? 'Your shortlist, saved to your account.' : 'Explore rental listings across Canada.'}</p></div><div className="action-row"><button onClick={onBack}>Dashboard</button>{userProfile.user_type === 'landlord' && (mine ? <button className="primary" onClick={() => { setError(''); setEdit({ ...emptyListing }); }}>Create listing</button> : <button onClick={() => onNavigate('my-properties')}>My properties</button>)}</div></header>
    {error && <p className="notice error" role="alert">{error} {!edit && !deleting && <button onClick={load}>Retry</button>}</p>}
    <section className="panel filter-bar" aria-label="Property filters">
      <label>Search<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Address or title" /></label>
      <label>City<select value={city} onChange={e => setCity(e.target.value)}><option value="">All cities</option>{[...new Set(properties.map(p => p.city))].sort().map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Maximum rent<input type="number" min="0" value={maxRent} onChange={e => setMaxRent(e.target.value)} placeholder="Any price" /></label>
      <label>Bedrooms<select value={bedrooms} onChange={e => setBedrooms(e.target.value)}><option value="">Any</option><option value="0">Studio</option>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}{n === 4 ? '+' : ''}</option>)}</select></label>
      <label>Type<select value={type} onChange={e => setType(e.target.value)}><option value="">All types</option>{['Apartment', 'Single Family House', 'Condominium', 'Room'].map(t => <option key={t}>{t}</option>)}</select></label>
      <label>Sort<select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest</option><option value="low">Rent: low to high</option><option value="high">Rent: high to low</option></select></label>
      <button onClick={() => { setQuery(''); setCity(''); setMaxRent(''); setBedrooms(''); setType(''); setSort('newest'); }}>Clear filters</button>
    </section>
    {loading ? <p role="status">Loading properties…</p> : <><p className="result-count">Showing {visibleProperties.length} of {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}</p><div className="rental-grid">{visibleProperties.map(p => <article className="panel rental-card" key={p.id}><button className="image-button" onClick={() => setSelected(p)} aria-label={'View details for ' + p.title}><PropertyImage property={p} /></button><div className="rental-content"><p className="rental-price">{money(p.rent)}<small> / month</small></p><button className="title-button" onClick={() => setSelected(p)}><h2>{p.title}</h2></button><p>{p.address}</p><p>{p.bedrooms == null ? 'Beds unconfirmed' : p.bedrooms === 0 ? 'Studio' : p.bedrooms + ' beds'} · {p.bathrooms == null ? 'Baths unconfirmed' : p.bathrooms + ' bath'}{p.property_type ? ` · ${p.property_type}` : ''}</p>{p.description && <p className="rental-description">{p.description}</p>}{(!p.active || p.listing_status === 'unavailable') && <p className="tag">No longer available</p>}{p.imported && <small>Imported snapshot{p.listing_status === 'unknown' ? ' · source availability not yet rechecked' : ''}</small>}{actions(p)}</div></article>)}</div>
      {visibleProperties.length < filtered.length && <div className="load-more"><button onClick={() => setVisibleCount(count => count + 24)}>Load more properties</button></div>}
      {!filtered.length && <div className="panel empty-state"><h2>{savedOnly ? 'Your shortlist starts here' : 'No properties found'}</h2><p>{mine ? 'Create your first listing to make it available to tenants.' : 'Try other filters or browse available properties.'}</p>{savedOnly && <button onClick={() => onNavigate('browse-properties')}>Browse properties</button>}</div>}</>}
    {selected && <div className="dialog-backdrop" onClick={() => setSelected(null)}><section className="dialog panel" role="dialog" aria-modal="true" aria-labelledby="property-title" onClick={e => e.stopPropagation()}><button className="dialog-close" onClick={() => setSelected(null)}>Close</button><PropertyGallery property={selected} /><h2 id="property-title">{selected.title}</h2><p className="rental-price">{money(selected.rent)} / month</p><p>{selected.address}</p><PropertySnapshot property={selected} /><p className="preserve-lines">{selected.description || 'No description provided.'}</p>{selected.imported && <p className="notice">This is an imported listing snapshot.{selected.listing_status === 'unavailable' ? ' The source listing is no longer available.' : selected.listing_status === 'unknown' ? ' Source availability has not been rechecked yet.' : ''}</p>}<LocationInsights result={selectedLocationInsights} onRetry={retryLocationInsights} />{actions(selected)}</section></div>}
    {edit && <div className="dialog-backdrop"><form className="dialog panel form-grid" role="dialog" aria-modal="true" aria-labelledby="edit-title" onSubmit={submitListing}><h2 id="edit-title" className="wide">{edit.id ? 'Edit listing' : 'Create listing'}</h2>{error && <p className="notice error wide" role="alert">{error}</p>}
      {[['title', 'Listing title', 'text'], ['address', 'Street address', 'text'], ['city', 'City', 'text'], ['province', 'Province code', 'text'], ['rent', 'Monthly rent (CAD)', 'number'], ['bedrooms', 'Bedrooms (0 for studio)', 'number'], ['bathrooms', 'Bathrooms', 'number'], ['image', 'Photo URL (optional)', 'url'], ['lat', 'Latitude (optional)', 'number'], ['lon', 'Longitude (optional)', 'number']].map(([key, label, inputType]) => <label key={key}>{label}<input name={key} type={inputType} value={edit[key]} onChange={e => setEdit({ ...edit, [key]: e.target.value })} required={['title','address','city','rent','bedrooms','bathrooms'].includes(key)} step={key === 'bathrooms' ? '0.5' : key === 'bedrooms' ? '1' : 'any'} min={key === 'rent' ? 1 : key === 'bedrooms' ? 0 : key === 'bathrooms' ? 0.5 : undefined} maxLength={key === 'province' ? 2 : key === 'title' ? 200 : key === 'city' ? 100 : key === 'address' ? 300 : 2000} /></label>)}
      <label>Property type<select value={edit.property_type} onChange={e => setEdit({ ...edit, property_type: e.target.value })}>{['Apartment', 'Single Family House', 'Condominium', 'Room'].map(t => <option key={t}>{t}</option>)}</select></label>
      <label className="checkbox-label"><input type="checkbox" checked={edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} /> Available for rent</label>
      <label className="wide">Description<textarea value={edit.description} maxLength={10000} onChange={e => setEdit({ ...edit, description: e.target.value })} rows={4} /></label>
      <p className="wide muted">Coordinates are optional. Listings without coordinates appear in search but have no map pin.</p>
      <div className="action-row wide"><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save listing'}</button><button type="button" disabled={busy} onClick={() => { setEdit(null); setError(''); }}>Cancel</button></div>
    </form></div>}
    {deleting && <div className="dialog-backdrop"><section className="dialog panel" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete this listing?</h2><p>{deleting.title} will be removed from search and saved lists.</p>{error && <p role="alert">{error}</p>}<div className="action-row"><button className="danger" disabled={busy} onClick={deleteListing}>Delete listing</button><button disabled={busy} onClick={() => setDeleting(null)}>Cancel</button></div></section></div>}
  </main>;
}
