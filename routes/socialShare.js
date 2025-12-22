import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration des comptes sociaux de Kalvora
const SOCIAL_ACCOUNTS = {
  facebook: {
    url: 'https://www.facebook.com/BENDEJESUS.ANT',
    pageId: process.env.FACEBOOK_PAGE_ID,
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
  },
  linkedin: {
    url: 'https://www.linkedin.com/in/ben-anitcheou-695735381?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    pageId: process.env.LINKEDIN_PAGE_ID,
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
  },
  instagram: {
    url: 'https://www.instagram.com/benant70?igsh=ODQwaWx1b3QxOWl5',
    pageId: process.env.INSTAGRAM_PAGE_ID,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  },
  tiktok: {
    url: 'https://www.tiktok.com/@lumynis.officiel?_r=1&_t=ZS-92GSGjdVz56',
    pageId: process.env.TIKTOK_PAGE_ID,
    accessToken: process.env.TIKTOK_ACCESS_TOKEN,
  },
};

/**
 * POST /api/social/share-article
 * Auto-publish vendor article to all configured social media accounts
 * 
 * Body:
 * {
 *   articleId: string,
 *   title: string,
 *   description: string,
 *   imageUrl: string,
 *   articleUrl: string,
 *   vendor: { id, vendorApplicationId, name }
 * }
 */
router.post('/share-article', async (req, res) => {
  try {
    const { articleId, title, description, imageUrl, articleUrl, vendor } = req.body;

    if (!articleId || !title || !articleUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: articleId, title, articleUrl' 
      });
    }

    const results = {
      facebook: null,
      linkedin: null,
      instagram: null,
      tiktok: null,
    };

    // Préparer le contenu du partage
    const shareContent = {
      title,
      description: description || '',
      url: articleUrl,
      vendorName: vendor?.name || 'Kalvora Vendor',
      image: imageUrl,
    };

    // Récupérer le vendorApplicationId
    const vendorApplicationId = vendor?.vendorApplicationId || vendor?.id;

    // 1. Publier sur Facebook
    if (SOCIAL_ACCOUNTS.facebook.accessToken) {
      try {
        const result = await postToFacebook(shareContent);
        results.facebook = result;
        
        // Log success
        await logSocialShare('facebook', articleId, title, articleUrl, vendorApplicationId, 'success', result.postId, result.url);
      } catch (error) {
        results.facebook = { error: error.message };
        
        // Log failure
        await logSocialShare('facebook', articleId, title, articleUrl, vendorApplicationId, 'failed', null, null, error.message);
      }
    }

    // 2. Publier sur LinkedIn
    if (SOCIAL_ACCOUNTS.linkedin.accessToken) {
      try {
        const result = await postToLinkedIn(shareContent);
        results.linkedin = result;
        
        // Log success
        await logSocialShare('linkedin', articleId, title, articleUrl, vendorApplicationId, 'success', result.postId, result.url);
      } catch (error) {
        results.linkedin = { error: error.message };
        
        // Log failure
        await logSocialShare('linkedin', articleId, title, articleUrl, vendorApplicationId, 'failed', null, null, error.message);
      }
    }

    // 3. Publier sur Instagram
    if (SOCIAL_ACCOUNTS.instagram.accessToken) {
      try {
        const result = await postToInstagram(shareContent);
        results.instagram = result;
        
        // Log success
        await logSocialShare('instagram', articleId, title, articleUrl, vendorApplicationId, 'success', result.postId, result.url);
      } catch (error) {
        results.instagram = { error: error.message };
        
        // Log failure
        await logSocialShare('instagram', articleId, title, articleUrl, vendorApplicationId, 'failed', null, null, error.message);
      }
    }

    // 4. Publier sur TikTok
    if (SOCIAL_ACCOUNTS.tiktok.accessToken) {
      try {
        const result = await postToTikTok(shareContent);
        results.tiktok = result;
        
        // Log success
        await logSocialShare('tiktok', articleId, title, articleUrl, vendorApplicationId, 'success', result.postId, result.url);
      } catch (error) {
        results.tiktok = { error: error.message };
        
        // Log failure
        await logSocialShare('tiktok', articleId, title, articleUrl, vendorApplicationId, 'failed', null, null, error.message);
      }
    }

    return res.json({
      success: true,
      message: 'Article shared to social media accounts',
      articleId,
      results,
    });
  } catch (error) {
    console.error('Social share error:', error);
    return res.status(500).json({ 
      error: 'Failed to share article',
      details: error.message 
    });
  }
});

/**
 * Log social media share to database
 */
async function logSocialShare(platform, articleId, articleTitle, articleUrl, vendorApplicationId, status, postId, postUrl, errorMessage) {
  try {
    await prisma.socialMediaShare.create({
      data: {
        platform,
        articleId,
        articleTitle,
        articleUrl,
        vendorApplicationId: vendorApplicationId || 0, // Use 0 as default if not provided
        status,
        postId: postId || null,
        postUrl: postUrl || null,
        errorMessage: errorMessage || null,
      },
    });
  } catch (error) {
    console.error(`Failed to log social share for ${platform}:`, error);
    // Don't throw - just log the error
  }
}

/**
 * Facebook Graph API - Post to page
 */
async function postToFacebook(content) {
  const fetch = await import('node-fetch').then(m => m.default);
  
  const message = `
📢 ${content.title}

${content.description}

🔗 Lire l'article: ${content.url}

By ${content.vendorName} on Kalvora
  `.trim();

  const url = `https://graph.facebook.com/v18.0/${SOCIAL_ACCOUNTS.facebook.pageId}/feed`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: new URLSearchParams({
      message,
      link: content.url,
      access_token: SOCIAL_ACCOUNTS.facebook.accessToken,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Facebook API error');
  }

  return { postId: data.id, url: `https://facebook.com/${data.id}` };
}

/**
 * LinkedIn API - Share article
 */
async function postToLinkedIn(content) {
  const fetch = await import('node-fetch').then(m => m.default);
  
  const message = `${content.title}\n\n${content.description}\n\n${content.url}`;

  const url = 'https://api.linkedin.com/v2/ugcPosts';
  
  const body = {
    contentLanguage: 'en_US',
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.PublishOpen': {
        commerceContext: {
          assetOrigin: 'EXTERNAL',
          clickTrackingParams: 'null',
        },
        mediaCategory: 'ARTICLE',
        shareMediaCategory: 'ARTICLE',
      },
    },
    userGeneratedContent: {
      'com.linkedin.digitalmedia.MediaDetails': {
        media: {
          mediaType: 'LINK',
          staticImage: {
            storageId: content.image,
          },
        },
        originalUrl: content.url,
        sanitizedUrl: content.url,
        subDescription: content.description,
        title: content.title,
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SOCIAL_ACCOUNTS.linkedin.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'LinkedIn API error');
  }

  return { postId: data.id, url: `https://linkedin.com/feed/update/${data.id}` };
}

/**
 * Instagram Graph API - Share carousel/video
 */
async function postToInstagram(content) {
  const fetch = await import('node-fetch').then(m => m.default);
  
  const caption = `${content.title}\n\n${content.description}\n\n🔗 Lien: ${content.url}`;

  const url = `https://graph.instagram.com/v18.0/${SOCIAL_ACCOUNTS.instagram.pageId}/media`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: new URLSearchParams({
      image_url: content.image,
      caption,
      access_token: SOCIAL_ACCOUNTS.instagram.accessToken,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Instagram API error');
  }

  // Publish the media
  const publishUrl = `https://graph.instagram.com/v18.0/${SOCIAL_ACCOUNTS.instagram.pageId}/media_publish`;
  const publishResponse = await fetch(publishUrl, {
    method: 'POST',
    body: new URLSearchParams({
      creation_id: data.id,
      access_token: SOCIAL_ACCOUNTS.instagram.accessToken,
    }),
  });

  const publishData = await publishResponse.json();
  
  if (!publishResponse.ok) {
    throw new Error(publishData.error?.message || 'Instagram publish error');
  }

  return { postId: publishData.id, url: `https://instagram.com/p/${publishData.id}` };
}

/**
 * TikTok API - Share video/post
 * Note: TikTok API is more restrictive; this requires special integration
 */
async function postToTikTok(content) {
  const fetch = await import('node-fetch').then(m => m.default);
  
  // TikTok API requires OAuth and has strict rate limits
  // For now, return a share link that user can use
  const shareText = encodeURIComponent(`${content.title}\n${content.url}`);
  const tiktokShareUrl = `https://www.tiktok.com/share/article?url=${content.url}&text=${shareText}`;

  // In production, use TikTok's official API
  // This is a placeholder implementation
  return { 
    postId: 'tiktok_pending', 
    url: tiktokShareUrl,
    note: 'TikTok sharing requires manual authorization. User can use this link.'
  };
}

/**
 * GET /api/social/status
 * Check which social media accounts are configured
 */
router.get('/status', (req, res) => {
  const status = {};
  
  Object.entries(SOCIAL_ACCOUNTS).forEach(([platform, config]) => {
    status[platform] = {
      configured: !!config.accessToken,
      url: config.url,
    };
  });

  return res.json(status);
});

/**
 * GET /api/social/history
 * Get social media share history for a vendor
 */
router.get('/history', async (req, res) => {
  try {
    const { vendorApplicationId } = req.query;

    if (!vendorApplicationId) {
      return res.status(400).json({ error: 'vendorApplicationId required' });
    }

    const shares = await prisma.socialMediaShare.findMany({
      where: { vendorApplicationId: parseInt(vendorApplicationId) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json(shares);
  } catch (error) {
    console.error('Error fetching social share history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /api/social/analytics
 * Get social media sharing analytics for a vendor
 */
router.get('/analytics', async (req, res) => {
  try {
    const { vendorApplicationId } = req.query;

    if (!vendorApplicationId) {
      return res.status(400).json({ error: 'vendorApplicationId required' });
    }

    const vendorId = parseInt(vendorApplicationId);

    // Get success/failure counts by platform
    const shares = await prisma.socialMediaShare.findMany({
      where: { vendorApplicationId: vendorId },
    });

    const analytics = {
      totalShares: shares.length,
      byPlatform: {
        facebook: { total: 0, success: 0, failed: 0 },
        linkedin: { total: 0, success: 0, failed: 0 },
        instagram: { total: 0, success: 0, failed: 0 },
        tiktok: { total: 0, success: 0, failed: 0 },
      },
      successRate: 0,
    };

    shares.forEach(share => {
      const platform = share.platform;
      if (analytics.byPlatform[platform]) {
        analytics.byPlatform[platform].total++;
        if (share.status === 'success') {
          analytics.byPlatform[platform].success++;
        } else if (share.status === 'failed') {
          analytics.byPlatform[platform].failed++;
        }
      }
    });

    const successCount = shares.filter(s => s.status === 'success').length;
    analytics.successRate = shares.length > 0 ? Math.round((successCount / shares.length) * 100) : 0;

    return res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
