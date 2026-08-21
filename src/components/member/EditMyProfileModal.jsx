import React, { useState } from 'react';
import { X, Camera, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { tr, trf } from '../../i18n/translations';

export default function EditMyProfileModal({ member, stakeId, wardId, db, storage, onClose, onSave }) {
  const [formData, setFormData] = useState({
    preferredName: member.preferredName || '',
    aboutMe: member.aboutMe || '',
    phone: member.phone || '',
    address: member.address || '',
    dob: member.dob || '',
    maritalStatus: member.maritalStatus || '',
    anniversary: member.anniversary || '',
    ethnicity: member.ethnicity || '',
    spouseName: member.spouseName || '',
    numChildren: member.numChildren || '',
    childrenNames: member.childrenNames || '',
    occupation: member.occupation || '',
    employer: member.employer || '',
    education: member.education || '',
    hobbies: member.hobbies || '',
    interests: member.interests || '',
    talents: member.talents || '',
    favoriteBooks: member.favoriteBooks || '',
    favoriteMusic: member.favoriteMusic || '',
    spiritualJourney: member.spiritualJourney || '',
    favoriteScripture: member.favoriteScripture || '',
    testimony: member.testimony || '',
    callings: member.callings || '',
    personalGoals: member.personalGoals || '',
    familyGoals: member.familyGoals || '',
    spiritualGoals: member.spiritualGoals || '',
    profilePicUrl: member.profilePicUrl || ''
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(member.profilePicUrl || '');

  const handleChange = (field, value) => {
    if (field === 'dob' && value && value.includes('-') && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = value.split('-');
      value = `${month}/${day}/${year}`;
    }
    if (field === 'anniversary' && value && value.includes('-') && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = value.split('-');
      value = `${month}/${day}/${year}`;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(tr('Please upload an image file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(tr('Image must be less than 5MB'));
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profilePics/${member.id}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setFormData(prev => ({ ...prev, profilePicUrl: downloadUrl }));
      setProfilePicPreview(downloadUrl);

      alert(tr('Profile picture uploaded successfully!'));
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(tr('Error uploading picture. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'members', member.id), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      onSave();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(tr('Error saving profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">{tr('Edit My Profile')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b">
            <div className="relative">
              {profilePicPreview ? (
                <img
                  src={profilePicPreview}
                  alt={tr('Profile')}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-200">
                  <span className="text-4xl text-primary-400">{member.fullName?.[0] || '?'}</span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-primary-500 text-white p-3 rounded-full cursor-pointer hover:bg-primary-600 transition-colors">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && <p className="text-sm text-gray-500 mt-2">{tr('Uploading...')}</p>}
            <p className="text-xs text-gray-500 mt-2">{tr('Click camera icon to upload')}</p>
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-800">{member.fullName}</p>
              <p className="text-sm text-gray-500">{member.email}</p>
              <p className="text-xs text-amber-600 mt-1">{tr('Name and email cannot be changed')}</p>
            </div>
          </div>

          {/* Form Sections */}
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{tr('Basic Information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Preferred Name/Nickname')}</label>
                  <input
                    type="text"
                    value={formData.preferredName}
                    onChange={(e) => handleChange('preferredName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr('What you like to be called')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Address')}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Date of Birth')}</label>
                  <input
                    type="date"
                    value={
                      formData.dob && formData.dob.includes('/')
                        ? (() => {
                            const [month, day, year] = formData.dob.split('/');
                            return `${year}-${month}-${day}`;
                          })()
                        : formData.dob
                    }
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Marital Status')}</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => handleChange('maritalStatus', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{tr('Select...')}</option>
                    <option value="single">{tr('Single')}</option>
                    <option value="married">{tr('Married')}</option>
                    <option value="widowed">{tr('Widowed')}</option>
                    <option value="divorced">{tr('Divorced')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Cultural Background')}</label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={(e) => handleChange('ethnicity', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr('Optional')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('About Me')}</label>
                  <textarea
                    value={formData.aboutMe}
                    onChange={(e) => handleChange('aboutMe', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={tr('Tell others a little about yourself...')}
                  />
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{tr('Family Information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Spouse Name')}</label>
                  <input
                    type="text"
                    value={formData.spouseName}
                    onChange={(e) => handleChange('spouseName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Anniversary')}</label>
                  <input
                    type="date"
                    value={
                      formData.anniversary && formData.anniversary.includes('/')
                        ? (() => {
                            const [month, day, year] = formData.anniversary.split('/');
                            return `${year}-${month}-${day}`;
                          })()
                        : formData.anniversary
                    }
                    onChange={(e) => handleChange('anniversary', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Number of Children')}</label>
                  <input
                    type="number"
                    value={formData.numChildren}
                    onChange={(e) => handleChange('numChildren', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr("Children's Names")}</label>
                  <input
                    type="text"
                    value={formData.childrenNames}
                    onChange={(e) => handleChange('childrenNames', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr('e.g., John, Mary, David')}
                  />
                </div>
              </div>
            </div>

            {/* Professional & Education */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{tr('Professional & Education')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Occupation')}</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Employer')}</label>
                  <input
                    type="text"
                    value={formData.employer}
                    onChange={(e) => handleChange('employer', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Education')}</label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr("e.g., Bachelor's in Computer Science, University of Nevada")}
                  />
                </div>
              </div>
            </div>

            {/* Hobbies & Interests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{tr('Hobbies & Interests')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Hobbies')}</label>
                  <input
                    type="text"
                    value={formData.hobbies}
                    onChange={(e) => handleChange('hobbies', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr('e.g., Hiking, Photography, Cooking')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Interests')}</label>
                  <input
                    type="text"
                    value={formData.interests}
                    onChange={(e) => handleChange('interests', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr('e.g., Travel, History, Technology')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Talents')}</label>
                  <input
                    type="text"
                    value={formData.talents}
                    onChange={(e) => handleChange('talents', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr('e.g., Piano, Public Speaking, Gardening')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Favorite Books')}</label>
                  <input
                    type="text"
                    value={formData.favoriteBooks}
                    onChange={(e) => handleChange('favoriteBooks', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Favorite Music')}</label>
                  <input
                    type="text"
                    value={formData.favoriteMusic}
                    onChange={(e) => handleChange('favoriteMusic', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Spiritual Journey */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{tr('Spiritual Journey')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('My Spiritual Journey')}</label>
                  <textarea
                    value={formData.spiritualJourney}
                    onChange={(e) => handleChange('spiritualJourney', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={tr('Share your conversion story or spiritual experiences...')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Favorite Scripture')}</label>
                  <textarea
                    value={formData.favoriteScripture}
                    onChange={(e) => handleChange('favoriteScripture', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={tr('e.g., Alma 32:21')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Testimony')}</label>
                  <textarea
                    value={formData.testimony}
                    onChange={(e) => handleChange('testimony', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={tr('Share your testimony...')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Current Callings')}</label>
                  <input
                    type="text"
                    value={formData.callings}
                    onChange={(e) => handleChange('callings', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={tr('e.g., Relief Society Teacher')}
                  />
                </div>
              </div>
            </div>

            {/* Goals & Aspirations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{tr('Goals & Aspirations')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Personal Goals')}</label>
                  <textarea
                    value={formData.personalGoals}
                    onChange={(e) => handleChange('personalGoals', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={tr('What are you working towards personally?')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Family Goals')}</label>
                  <textarea
                    value={formData.familyGoals}
                    onChange={(e) => handleChange('familyGoals', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={tr('Goals for your family...')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Spiritual Goals')}</label>
                  <textarea
                    value={formData.spiritualGoals}
                    onChange={(e) => handleChange('spiritualGoals', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={tr('Your spiritual aspirations...')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {tr('Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? tr('Saving...') : tr('Save Profile')}
          </button>
        </div>
      </div>
    </div>
  );
}