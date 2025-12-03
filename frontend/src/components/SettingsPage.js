import React from 'react';
import { api } from '../services/api';

const SettingsPage = ({ userProfile, onBack, onSavePrefs }) => {
  const effectiveUserId = userProfile?.id || userProfile?.email || 'anon';
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(`rently_profile_form_${effectiveUserId}`) || 'null'); } catch { return null; }
  })();

  const [form, setForm] = React.useState({
    avatar: saved?.avatar || '',
    bio: saved?.bio || '',
    budget: saved?.budget || '',
    city: saved?.city || '',
    cleanliness: saved?.cleanliness || 'moderate',
    sleepSchedule: saved?.sleepSchedule || 'flexible',
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    localStorage.setItem(`rently_profile_form_${effectiveUserId}`, JSON.stringify(form));
    const prefsKey = `rently_user_preferences_${effectiveUserId}`;
    const existingPrefs = (() => { try { return JSON.parse(localStorage.getItem(prefsKey) || 'null'); } catch { return null; } })();
    const updatedPrefs = {
      ...(existingPrefs || {}),
      budget: form.budget || existingPrefs?.budget,
      cleanliness: form.cleanliness || existingPrefs?.cleanliness,
      sleepSchedule: form.sleepSchedule || existingPrefs?.sleepSchedule,
      location: form.city || existingPrefs?.location,
    };
    localStorage.setItem(prefsKey, JSON.stringify(updatedPrefs));
    if (onSavePrefs) {
      onSavePrefs(updatedPrefs);
    }
    try {
      await api.savePreferences({
        user_id: effectiveUserId,
        budget: form.budget,
        cleanliness: form.cleanliness,
        sleepSchedule: form.sleepSchedule,
        city: form.city,
        avatar: form.avatar,
      });
    } catch (e) {
      // ignore for now
    }
    onBack();
  };

  return (
    <div className="settings-page">
      <div className="settings-header-row">
        <button className="text-btn" onClick={onBack}>← Back</button>
        <h2>Edit profile</h2>
      </div>

      <div className="settings-card">
        <div className="row">
          <div className="avatar-large">
            {form.avatar ? <img src={form.avatar} alt="avatar" /> : <span className="emoji-avatar">👤</span>}
          </div>
          <div className="avatar-actions">
            <label className="upload-btn">
              Change photo
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          </div>
        </div>

        <label>Bio</label>
        <textarea value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} placeholder="Tell others about you" maxLength={200} />

        <label>Budget</label>
        <input type="number" value={form.budget} onChange={(e) => handleChange('budget', e.target.value)} placeholder="1500" />

        <label>Preferred city/address</label>
        <input type="text" value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="1342 College Drive, Saskatoon" />

        <label>Cleanliness</label>
        <select value={form.cleanliness} onChange={(e) => handleChange('cleanliness', e.target.value)}>
          <option value="messy">Messy</option>
          <option value="moderate">Moderate</option>
          <option value="clean">Clean</option>
          <option value="very_clean">Very clean</option>
        </select>

        <label>Sleep schedule</label>
        <select value={form.sleepSchedule} onChange={(e) => handleChange('sleepSchedule', e.target.value)}>
          <option value="early_bird">Early Bird</option>
          <option value="night_owl">Night Owl</option>
          <option value="flexible">Flexible</option>
        </select>

        <button className="primary-btn" onClick={handleSave}>Save changes</button>
      </div>

      <style>{`
        .settings-page { max-width: 720px; margin: 0 auto; padding: 24px; font-family: 'Inter', sans-serif; }
        .settings-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .settings-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); border: 1px solid #f1f1f1; display: flex; flex-direction: column; gap: 12px; }
        .row { display: flex; align-items: center; gap: 16px; }
        .avatar-large { width: 80px; height: 80px; border-radius: 18px; overflow: hidden; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
        .avatar-large img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-actions { display: flex; flex-direction: column; gap: 8px; }
        .upload-btn { background: linear-gradient(90deg, #fd5068, #ff6b9d); color: white; border: none; border-radius: 10px; padding: 10px 14px; cursor: pointer; font-weight: 600; width: fit-content; }
        label { font-weight: 600; font-size: 0.9rem; color: #111827; }
        input, select, textarea { width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; font-size: 0.95rem; }
        textarea { min-height: 100px; resize: vertical; }
        .primary-btn { background: #111827; color: white; border: none; padding: 12px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; margin-top: 8px; }
      `}</style>
    </div>
  );
};

export default SettingsPage;
