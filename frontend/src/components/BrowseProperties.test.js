import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import BrowseProperties from './BrowseProperties';
import { api } from '../services/api';

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../services/api', () => ({
  api: {
    getProperties: jest.fn(),
    getSavedProperties: jest.fn(),
    analyzeLocationInsights: jest.fn(),
    saveProperty: jest.fn(),
    unsaveProperty: jest.fn(),
  },
}));

const property = {
  id: 42, owner_id: 9, title: 'Campus apartment', address: '101 College Drive', city: 'Saskatoon', province: 'SK',
  rent: 1400, bedrooms: 1, bathrooms: 1, property_type: 'Apartment', description: 'Close to campus.', active: true,
  url: 'https://www.kijiji.ca/v-apartments-condos/saskatoon/campus-apartment/1234567890',
  image: 'https://media.example.test/campus-main.jpg', images: ['https://media.example.test/campus-main.jpg', 'https://media.example.test/campus-gallery.jpg'],
  square_feet: 650, parking: 'One stall', pets: 'Cats allowed', utilities: ['Heat', 'Water'], appliances: ['Fridge'],
  features: ['Balcony'], lease_term: '12 months', available_date: 'May 1', imported: true, listing_status: 'unknown',
};
const detailedInsights = {
  location: { scope: 'detailed', display_name: '101 College Drive, Saskatoon, SK' },
  safety: { summary: 'No verified public-safety dataset is configured.', source_note: 'Safety data is unavailable.' },
  transit: { summary: 'A nearby transit stop was returned by the supplied evidence.' },
  amenities: { grocery: [{ name: 'Campus Market', distance_m: 180 }], healthcare: [], transit_stops: [], schools: [] },
  student_fit: { summary: 'Nearby amenities may be useful to students.' },
  ai_summary: 'This summary only reflects the supplied location evidence.',
  limitations: ['No verified public-safety dataset is configured.'],
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const buttonWithText = (container, text) => [...container.querySelectorAll('button')].find(button => button.textContent === text);

async function renderBrowse() {
  const container = document.createElement('div');
  const root = createRoot(container);
  document.body.appendChild(container);
  const onContact = jest.fn().mockResolvedValue();
  await act(async () => {
    root.render(<BrowseProperties mode="browse-properties" userProfile={{ id: 1, user_type: 'student' }} onBack={jest.fn()} onNavigate={jest.fn()} onContact={onContact} />);
    await flush();
  });
  return { container, root, onContact };
}

async function openProperty(container) {
  await act(async () => {
    container.querySelector('[aria-label="View details for Campus apartment"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
  });
}

describe('BrowseProperties location insights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getProperties.mockResolvedValue({ properties: [property] });
    api.getSavedProperties.mockResolvedValue({ properties: [] });
    api.saveProperty.mockResolvedValue({ success: true });
    api.unsaveProperty.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders detailed insights once and reuses the cached result when reopened', async () => {
    let resolveInsights;
    api.analyzeLocationInsights.mockReturnValue(new Promise(resolve => { resolveInsights = resolve; }));
    const { container, root } = await renderBrowse();

    await openProperty(container);
    expect(container.textContent).toContain('Analyzing area information…');
    await act(async () => {
      resolveInsights({ success: true, insights: detailedInsights });
      await flush();
    });
    expect(container.textContent).toContain('Campus Market (180 m)');
    expect(api.analyzeLocationInsights).toHaveBeenCalledTimes(1);

    await act(async () => { buttonWithText(container, 'Close').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await openProperty(container);
    expect(container.textContent).toContain('Campus Market (180 m)');
    expect(api.analyzeLocationInsights).toHaveBeenCalledTimes(1);
    await act(async () => { root.unmount(); });
  });

  test('shows unavailable and retryable error states inside the modal', async () => {
    api.analyzeLocationInsights.mockResolvedValue({ success: true, insights: { ...detailedInsights, data_quality: { insufficient_evidence: true } } });
    const unavailable = await renderBrowse();
    await openProperty(unavailable.container);
    await act(async () => { await flush(); });
    expect(unavailable.container.textContent).toContain('Detailed location insights unavailable');
    await act(async () => { unavailable.root.unmount(); });

    api.analyzeLocationInsights.mockRejectedValueOnce(new Error('Location insights are temporarily unavailable.')).mockResolvedValueOnce({ success: true, insights: detailedInsights });
    const failed = await renderBrowse();
    await openProperty(failed.container);
    await act(async () => { await flush(); });
    expect(failed.container.textContent).toContain('Location insights are temporarily unavailable.');
    await act(async () => {
      buttonWithText(failed.container, 'Try again').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flush();
    });
    expect(failed.container.textContent).toContain('Campus Market (180 m)');
    await act(async () => { failed.root.unmount(); });
  });

  test('keeps save and contact actions working while insights load', async () => {
    api.analyzeLocationInsights.mockResolvedValue({ success: true, insights: detailedInsights });
    const { container, root, onContact } = await renderBrowse();
    await openProperty(container);

    await act(async () => {
      buttonWithText(container, '♡ Save').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flush();
    });
    expect(api.saveProperty).toHaveBeenCalledWith(property.id);
    await act(async () => {
      buttonWithText(container, 'Message landlord').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flush();
    });
    expect(onContact).toHaveBeenCalledWith(property.owner_id);
    await act(async () => { root.unmount(); });
  });

  test('renders persisted images and imported snapshot details without local JSON data', async () => {
    api.analyzeLocationInsights.mockResolvedValue({ success: true, insights: detailedInsights });
    api.getProperties.mockResolvedValue({ properties: [{ ...property, owner_id: null }] });
    const { container, root } = await renderBrowse();
    expect(container.querySelector('.rental-image').src).toContain('campus-main.jpg');
    await openProperty(container);
    expect(container.textContent).toContain('Square footage');
    expect(container.textContent).toContain('650 sq ft');
    expect(container.textContent).toContain('Heat, Water');
    expect(container.querySelectorAll('.property-gallery img')).toHaveLength(1);
    expect(container.textContent).toContain('View source listing');
    await act(async () => { root.unmount(); });
  });

  test('can close the modal while an insights request is still pending', async () => {
    let resolveInsights;
    api.analyzeLocationInsights.mockReturnValue(new Promise(resolve => { resolveInsights = resolve; }));
    const { container, root } = await renderBrowse();
    await openProperty(container);
    expect(container.textContent).toContain('Analyzing area information…');

    await act(async () => { buttonWithText(container, 'Close').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => {
      resolveInsights({ success: true, insights: detailedInsights });
      await flush();
    });
    expect(container.textContent).not.toContain('Location Insights');
    await act(async () => { root.unmount(); });
  });
});
