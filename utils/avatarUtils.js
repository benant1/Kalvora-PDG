const API_BASE_URL = process.env.API_BASE_URL || 'https://kalvora-pdg.vercel.app';

/**
 * Normalise une URL d'avatar pour s'assurer qu'elle est complète
 * @param {string} avatar - L'URL de l'avatar à normaliser
 * @returns {string} - L'URL normalisée
 */
function normalizeAvatarUrl(avatar) {
  if (!avatar) return '';
  
  // Si c'est déjà une URL complète, on la retourne telle quelle
  if (avatar.startsWith('http')) {
    return avatar;
  }
  
  // Si c'est un chemin relatif, on ajoute l'URL de base
  return avatar.startsWith('/') 
    ? `${API_BASE_URL}${avatar}`
    : `${API_BASE_URL}/${avatar}`;
}

/**
 * Normalise l'URL de l'avatar dans un objet utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {Object} - L'objet utilisateur avec l'URL de l'avatar normalisée
 */
function normalizeUserAvatar(user) {
  if (!user || !user.avatar) return user;
  
  return {
    ...user,
    avatar: normalizeAvatarUrl(user.avatar)
  };
}

module.exports = {
  normalizeAvatarUrl,
  normalizeUserAvatar
};
