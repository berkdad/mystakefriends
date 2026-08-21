import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, Baby, Heart, Briefcase, GraduationCap, Book, Music, Palette, Mountain, Church, Star, Trophy, Globe } from 'lucide-react';
import { tr, trf } from '../../i18n/translations';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ordinalSuffix = (n) => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Month/day only, no year — e.g. "June 28th". Used for non-admin viewers.
const formatBirthdayNoYear = (dob) => {
  if (!dob) return '';
  const parts = String(dob).split('/');
  if (parts.length < 2) return dob;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (!month || !day || month < 1 || month > 12) return dob;
  return `${tr(MONTH_NAMES[month - 1])} ${day}${tr(ordinalSuffix(day))}`;
};

// canSeeBirthYear: admins (ward/stake/super) see the full date + age.
// Everyone else sees month/day only, since age reveals the birth year too.
export default function MemberProfileModal({ member, onClose, canSeeBirthYear = false }) {
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(member.dob);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header with profile picture */}
        <div className="relative h-32 z-0" style={{background: 'linear-gradient(to bottom, #f472b6 0%, #fbbf24 60%, rgba(255,255,255,1) 100%)'}}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors z-20"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="px-8 pb-8">
          {/* Profile Picture and Name */}
          <div className="flex items-end gap-6 -mt-16 mb-6 relative z-10">
            {member.profilePicUrl ? (
              <img
                src={member.profilePicUrl}
                alt={member.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-4xl text-primary-400">{member.fullName?.[0] || '?'}</span>
              </div>
            )}
            <div className="flex-1 pb-4">
              <h2 className="text-3xl font-bold text-gray-800">{member.fullName}</h2>
              {member.preferredName && member.preferredName !== member.fullName && (
                <p className="text-lg text-gray-600 italic">"{member.preferredName}"</p>
              )}
            </div>
          </div>

          {/* About Me */}
          {member.aboutMe && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{tr('About Me')}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{member.aboutMe}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{tr('Contact Information')}</h3>

              {member.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">{tr('Email')}</p>
                    <p className="text-gray-800">{member.email}</p>
                  </div>
                </div>
              )}

              {member.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">{tr('Phone')}</p>
                    <p className="text-gray-800">{member.phone}</p>
                  </div>
                </div>
              )}

              {member.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">{tr('Address')}</p>
                    <p className="text-gray-800">{member.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{tr('Personal Details')}</h3>

              {member.dob && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">{tr('Birthday')}</p>
                    <p className="text-gray-800">
                      {canSeeBirthYear
                        ? `${member.dob}${age ? ` ${trf('({0} years old)', age)}` : ''}`
                        : formatBirthdayNoYear(member.dob)}
                    </p>
                  </div>
                </div>
              )}

              {member.anniversary && (
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-primary-500 mt-0.5 fill-current" />
                  <div>
                    <p className="text-sm text-gray-600">{tr('Anniversary')}</p>
                    <p className="text-gray-800">{member.anniversary}</p>
                  </div>
                </div>
              )}

              {member.ethnicity && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">{tr('Cultural Background')}</p>
                    <p className="text-gray-800">{member.ethnicity}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Family Information */}
            {(member.numChildren || member.childrenNames || member.spouseName) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{tr('Family')}</h3>

                {member.spouseName && (
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{tr('Spouse')}</p>
                      <p className="text-gray-800">{member.spouseName}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Professional & Education */}
            {(member.occupation || member.education || member.employer) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{tr('Professional & Education')}</h3>

                {member.occupation && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{tr('Occupation')}</p>
                      <p className="text-gray-800">{member.occupation}</p>
                    </div>
                  </div>
                )}

                {member.employer && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{tr('Employer')}</p>
                      <p className="text-gray-800">{member.employer}</p>
                    </div>
                  </div>
                )}

                {member.education && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{tr('Education')}</p>
                      <p className="text-gray-800">{member.education}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hobbies & Interests */}
            {(member.hobbies || member.interests || member.talents || member.favoriteBooks || member.favoriteMusic) && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{tr('Hobbies & Interests')}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {member.hobbies && (
                    <div className="flex items-start gap-3">
                      <Mountain className="w-5 h-5 text-primary-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{tr('Hobbies')}</p>
                        <p className="text-gray-800">{member.hobbies}</p>
                      </div>
                    </div>
                  )}

                  {member.interests && (
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-primary-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{tr('Interests')}</p>
                        <p className="text-gray-800">{member.interests}</p>
                      </div>
                    </div>
                  )}

                  {member.talents && (
                    <div className="flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-primary-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{tr('Talents')}</p>
                        <p className="text-gray-800">{member.talents}</p>
                      </div>
                    </div>
                  )}

                  {member.favoriteBooks && (
                    <div className="flex items-start gap-3">
                      <Book className="w-5 h-5 text-primary-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{tr('Favorite Books')}</p>
                        <p className="text-gray-800">{member.favoriteBooks}</p>
                      </div>
                    </div>
                  )}

                  {member.favoriteMusic && (
                    <div className="flex items-start gap-3">
                      <Music className="w-5 h-5 text-primary-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{tr('Favorite Music')}</p>
                        <p className="text-gray-800">{member.favoriteMusic}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Spiritual Journey */}
            {(member.spiritualJourney || member.favoriteScripture || member.testimony || member.callings) && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{tr('Spiritual Journey')}</h3>

                {member.spiritualJourney && (
                  <div className="flex items-start gap-3">
                    <Church className="w-5 h-5 text-primary-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{tr('My Spiritual Journey')}</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{member.spiritualJourney}</p>
                    </div>
                  </div>
                )}

                {member.favoriteScripture && (
                  <div className="flex items-start gap-3">
                    <Book className="w-5 h-5 text-primary-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{tr('Favorite Scripture')}</p>
                      <p className="text-gray-800 italic whitespace-pre-wrap">{member.favoriteScripture}</p>
                    </div>
                  </div>
                )}

                {member.testimony && (
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-primary-500 mt-0.5 fill-current" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{tr('Testimony')}</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{member.testimony}</p>
                    </div>
                  </div>
                )}

                {member.callings && (
                  <div className="flex items-start gap-3">
                    <Church className="w-5 h-5 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{tr('Current Callings')}</p>
                      <p className="text-gray-800">{member.callings}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Goals & Aspirations */}
            {(member.personalGoals || member.familyGoals || member.spiritualGoals) && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{tr('Goals & Aspirations')}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {member.personalGoals && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">{tr('Personal Goals')}</p>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{member.personalGoals}</p>
                    </div>
                  )}

                  {member.familyGoals && (
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">{tr('Family Goals')}</p>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{member.familyGoals}</p>
                    </div>
                  )}

                  {member.spiritualGoals && (
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-800 mb-2">{tr('Spiritual Goals')}</p>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{member.spiritualGoals}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}