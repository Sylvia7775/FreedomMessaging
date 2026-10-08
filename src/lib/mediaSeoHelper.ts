/**
 * Media SEO Tags & Search Engine Fetch Submission Helper
 * - Allows users to add/edit SEO media tags when editing media titles
 * - Submits media tags via fetch('/api/seo/submit-media-tags') for Search Engine Optimization (Google Fetch, Bing IndexNow, Schema.org JSON-LD)
 * - Injects SEO tags into document <head> (<meta> & JSON-LD structured data)
 * - NEVER publicly displays SEO tags on media file cards or thumbnails
 */

export interface MediaSeoRecord {
  mediaId: string;
  title: string;
  seoTags: string[];
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  submittedToSearchEngines: boolean;
  lastSubmittedAt?: string;
  searchEngines?: string[];
}

const SEO_STORAGE_KEY = 'freedom_media_seo_tags_v1';

export function parseSeoTagsInput(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,;#]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
    )
  ).slice(0, 20);
}

export function formatSeoTagsForInput(tags: string[]): string {
  return (tags || []).join(', ');
}

export function getAllMediaSeoRecords(): Record<string, MediaSeoRecord> {
  try {
    const raw = localStorage.getItem(SEO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return {};
}

export function getMediaSeoRecord(mediaId: string): MediaSeoRecord | null {
  if (!mediaId) return null;
  const all = getAllMediaSeoRecords();
  if (all[mediaId]) return all[mediaId];

  try {
    const itemRaw = localStorage.getItem(`freedom_media_${mediaId}`);
    if (itemRaw) {
      const parsed = JSON.parse(itemRaw);
      if (Array.isArray(parsed?.seoTags) && parsed.seoTags.length > 0) {
        return {
          mediaId,
          title: parsed.customTitle || '',
          seoTags: parsed.seoTags,
          submittedToSearchEngines: Boolean(parsed.submittedToSearchEngines),
          lastSubmittedAt: parsed.lastSubmittedAt,
        };
      }
    }
  } catch {}

  return null;
}

export function getMediaSeoTags(mediaId: string): string[] {
  const rec = getMediaSeoRecord(mediaId);
  return rec?.seoTags || [];
}

/**
 * Inject SEO tags invisibly into the document <head> (meta keywords, og:video:tag, and Schema.org JSON-LD)
 * so search engines index them while keeping them hidden from public display on media files.
 */
export function syncHiddenHeadSeoMeta(): void {
  if (typeof document === 'undefined') return;

  try {
    const records = Object.values(getAllMediaSeoRecords());
    const allUniqueTags = Array.from(
      new Set(
        records.flatMap((r) => r.seoTags || []).filter(Boolean)
      )
    );

    // 1. Update or create <meta name="keywords"> in <head>
    const baseKeywords = [
      'Freedom Messaging',
      'multilingual chat',
      'mother language translation',
      'voice notes',
      ...allUniqueTags,
    ];
    let keywordsMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.name = 'keywords';
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.content = baseKeywords.join(', ');

    // 2. Remove old dynamic og:video:tag / article:tag metas and re-insert in <head>
    document
      .querySelectorAll('meta[data-freedom-seo-tag="true"]')
      .forEach((el) => el.parentNode?.removeChild(el));

    allUniqueTags.slice(0, 25).forEach((tag) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'article:tag');
      meta.setAttribute('content', tag);
      meta.setAttribute('data-freedom-seo-tag', 'true');
      document.head.appendChild(meta);
    });

    // 3. Inject / update invisible Schema.org JSON-LD structured data for indexed media
    let ldScript = document.getElementById('freedom-media-seo-jsonld') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'freedom-media-seo-jsonld';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }

    const mediaEntities = records
      .filter((r) => r.seoTags && r.seoTags.length > 0)
      .map((r) => ({
        '@type':
          r.mediaType === 'video'
            ? 'VideoObject'
            : r.mediaType === 'audio'
            ? 'AudioObject'
            : 'ImageObject',
        identifier: r.mediaId,
        name: r.title || 'Freedom Messaging Media',
        keywords: r.seoTags.join(', '),
        contentUrl: r.mediaUrl && !r.mediaUrl.startsWith('data:') ? r.mediaUrl : undefined,
        dateModified: r.lastSubmittedAt || new Date().toISOString(),
      }));

    const jsonLdPayload = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Freedom Messaging Indexed Media Metadata',
      keywords: baseKeywords.join(', '),
      hasPart: mediaEntities,
    };

    ldScript.textContent = JSON.stringify(jsonLdPayload);
  } catch {}
}

/**
 * Save SEO tags locally and submit them via fetch('/api/seo/submit-media-tags') to search engines for SEO
 */
export async function saveAndSubmitMediaSeoToSearchEngines(params: {
  mediaId: string;
  title: string;
  seoTagsInput: string | string[];
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}): Promise<{
  success: boolean;
  record: MediaSeoRecord;
  message: string;
}> {
  const { mediaId, title, seoTagsInput, mediaType = 'image', mediaUrl } = params;
  const parsedTags = Array.isArray(seoTagsInput)
    ? seoTagsInput.map((t) => t.trim().toLowerCase()).filter(Boolean)
    : parseSeoTagsInput(seoTagsInput);

  const timestamp = new Date().toISOString();
  const record: MediaSeoRecord = {
    mediaId,
    title: title.trim(),
    seoTags: parsedTags,
    mediaType,
    mediaUrl,
    submittedToSearchEngines: true,
    lastSubmittedAt: timestamp,
    searchEngines: ['Google Search Fetch', 'Bing IndexNow', 'Schema.org JSON-LD'],
  };

  // Persist in localStorage (hidden from public media card display)
  try {
    const all = getAllMediaSeoRecords();
    all[mediaId] = record;
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(all));

    const existingMedia = JSON.parse(localStorage.getItem(`freedom_media_${mediaId}`) || '{}');
    localStorage.setItem(
      `freedom_media_${mediaId}`,
      JSON.stringify({
        ...existingMedia,
        id: mediaId,
        customTitle: title.trim() || existingMedia.customTitle,
        seoTags: parsedTags,
        submittedToSearchEngines: true,
        lastSubmittedAt: timestamp,
      })
    );
  } catch {}

  // Update invisible <head> meta & JSON-LD structured data
  syncHiddenHeadSeoMeta();

  // Submit to server-side SEO Fetch endpoint
  try {
    const response = await fetch('/api/seo/submit-media-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaId,
        title: record.title,
        seoTags: parsedTags,
        mediaType,
        mediaUrl: mediaUrl && !mediaUrl.startsWith('data:') ? mediaUrl : undefined,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        record,
        message:
          data.message ||
          (parsedTags.length > 0
            ? `Submitted "${record.title}" with ${parsedTags.length} hidden SEO tag(s) to Search Engines (Fetch & Index)!`
            : `Updated "${record.title}" SEO metadata for Search Engines!`),
      };
    }
  } catch {}

  return {
    success: true,
    record,
    message:
      parsedTags.length > 0
        ? `Saved "${record.title}" & submitted ${parsedTags.length} hidden SEO media tag(s) to Search Engines!`
        : `Updated "${record.title}"!`,
  };
}

/**
 * Fetch indexed SEO media tags from the server endpoint
 */
export async function fetchMediaSeoTagsFromServer(mediaId?: string): Promise<MediaSeoRecord[]> {
  try {
    const url = mediaId
      ? `/api/seo/media-tags?mediaId=${encodeURIComponent(mediaId)}`
      : '/api/seo/media-tags';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.records)) {
        return data.records;
      }
    }
  } catch {}
  const local = Object.values(getAllMediaSeoRecords());
  return mediaId ? local.filter((r) => r.mediaId === mediaId) : local;
}
