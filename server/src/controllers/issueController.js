import { dbStore } from '../services/dbStore.js';
import { analyzeCivicImage } from '../services/aiService.js';
import { notificationService } from '../services/notificationService.js';

export const getIssues = async (req, res) => {
  try {
    const { category, status, priority, department, search } = req.query;
    const issues = await dbStore.getIssues({ category, status, priority, department, search });
    res.json({ success: true, count: issues.length, data: issues });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const issue = await dbStore.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category: userCategory,
      priority: userPriority,
      longitude,
      latitude,
      formattedAddress,
      citizenName,
      citizenPhone,
      citizenEmail,
      isAnonymous,
      precomputedAi,
    } = req.body;

    // Handle photo URL or uploaded file
    let photoUrl = req.body.photoUrl;
    let localFilePath = null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
      localFilePath = req.file.path;
    }

    if (!photoUrl && !req.body.imageBase64) {
      return res.status(400).json({ success: false, error: 'Photo evidence is required to report a civic issue.' });
    }

    // Default coordinates (Central Midtown) if none passed
    const lng = parseFloat(longitude) || -73.985131;
    const lat = parseFloat(latitude) || 40.748817;

    // Perform or use AI Multimodal Vision analysis
    let aiResult;
    if (precomputedAi && typeof precomputedAi === 'string') {
      try {
        aiResult = JSON.parse(precomputedAi);
      } catch (e) {
        // fallback to fresh analysis
      }
    }

    if (!aiResult) {
      aiResult = await analyzeCivicImage({
        imagePath: localFilePath,
        imageBase64: req.body.imageBase64,
        userDescription: `${title || ''} ${description || ''}`,
      });
    }

    // TC-14: Irrelevant input - do not invent a valid civic report
    if (aiResult && aiResult.isRelevant === false) {
      return res.status(400).json({
        success: false,
        isIrrelevant: true,
        error: aiResult.message || 'The submission does not describe a valid civic infrastructure issue.',
        guidance: aiResult.guidance,
      });
    }

    const assignedCategory = userCategory && userCategory !== 'AUTO' ? userCategory : (aiResult?.category || 'ROADS');
    const assignedPriority = userPriority && userPriority !== 'AUTO' ? userPriority : (aiResult?.priority || 'Medium');
    const assignedDept = aiResult?.recommendedDepartment || 'Roads & Bridges Department';

    // TC-18: Repeatability - Check for duplicate active grievance unless intended
    const allowDuplicate = req.body.allowDuplicate === true || req.body.allowDuplicate === 'true';
    if (!allowDuplicate) {
      const existingDuplicate = await dbStore.findDuplicateIssue({
        title: title || aiResult?.identifiedProblem,
        description,
        category: assignedCategory,
        coordinates: [lng, lat],
      });

      if (existingDuplicate) {
        return res.status(409).json({
          success: false,
          duplicateDetected: true,
          message: `Potential duplicate grievance detected! Ticket #${existingDuplicate.ticketId} already reports a similar civic issue (${existingDuplicate.title}) at this location.`,
          existingIssue: {
            _id: existingDuplicate._id,
            ticketId: existingDuplicate.ticketId,
            title: existingDuplicate.title,
            category: existingDuplicate.category,
            priority: existingDuplicate.priority,
            status: existingDuplicate.status,
            assignedDepartment: existingDuplicate.assignedDepartment,
            upvotes: existingDuplicate.upvotes || 1,
            address: existingDuplicate.address?.formatted,
            createdAt: existingDuplicate.createdAt,
          },
        });
      }
    }

    const ticketId = `CVX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const issueData = {
      ticketId,
      title: title || aiResult.identifiedProblem || 'Civic Infrastructure Concern',
      description: description || 'Reported via CivixAI Citizen Portal with photo telemetry.',
      category: assignedCategory,
      priority: assignedPriority,
      status: 'Pending Triage',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      address: {
        street: formattedAddress || 'Civic Centerway',
        landmark: 'Near Municipal Marker',
        area: 'Metro Central',
        city: 'Metro City',
        formatted: formattedAddress || `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      },
      media: {
        photoUrl: photoUrl || (req.body.imageBase64 ? req.body.imageBase64 : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000'),
        resolutionPhotoUrl: '',
      },
      aiAnalysis: aiResult,
      assignedDepartment: assignedDept,
      citizenInfo: {
        name: citizenName || (isAnonymous === 'true' || isAnonymous === true ? 'Anonymous Citizen' : 'Civic Reporter'),
        phone: citizenPhone || '+1 (555) 234-5678',
        email: citizenEmail || 'citizen@civix.gov',
        anonymous: Boolean(isAnonymous === 'true' || isAnonymous === true),
      },
    };

    const newIssue = await dbStore.createIssue(issueData);

    // Trigger Automated Email/SMS Alert to Municipal Admin
    notificationService.sendIssueAlert({
      ticketId,
      priority: assignedPriority,
      category: assignedCategory,
      department: assignedDept,
      address: issueData.address.formatted,
    });

    res.status(201).json({
      success: true,
      data: newIssue,
      message: `Grievance #${ticketId} created, analyzed with AI, and routed to ${assignedDept}.`,
    });
  } catch (err) {
    console.error('[CivixAI] Create issue error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, note, updatedBy, resolutionPhotoUrl } = req.body;
    const issue = await dbStore.addStatusUpdate(req.params.id, {
      status,
      note,
      updatedBy,
      resolutionPhotoUrl,
    });

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    // Send SMS alert to citizen on status transition
    if (issue.citizenInfo && issue.citizenInfo.phone) {
      notificationService.sendCitizenStatusUpdate({
        ticketId: issue.ticketId,
        citizenPhone: issue.citizenInfo.phone,
        newStatus: status,
        note,
      });
    }

    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const upvoteIssue = async (req, res) => {
  try {
    const updated = await dbStore.addUpvote(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    res.json({ success: true, upvotes: updated.upvotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text, author, isOfficial } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    const updated = await dbStore.addComment(req.params.id, { text, author, isOfficial });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getNearbyIssues = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;
    if (!lng || !lat) {
      return res.status(400).json({ success: false, error: 'Coordinates (lng, lat) are required' });
    }

    const issues = await dbStore.findNear(lng, lat, maxDistance);
    res.json({
      success: true,
      count: issues.length,
      center: { lng: parseFloat(lng), lat: parseFloat(lat) },
      radiusMeters: parseInt(maxDistance),
      data: issues,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const reverseGeocode = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lng query params are required' });
    }

    // 1. Try OpenStreetMap Nominatim with 6s timeout
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'CivixAI-Platform/1.0 (civic-issue-resolver)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};

        const place = addr.amenity || addr.building || addr.landmark || '';
        const road = addr.road || addr.pedestrian || addr.highway || '';
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.hamlet || '';
        const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '';
        const state = addr.state || '';
        const postalCode = addr.postcode || '';

        let streetPart = place;
        if (road && place) {
          streetPart = `${place}, ${road}`;
        } else if (road) {
          streetPart = road;
        }

        const parts = [streetPart, area, city, state].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(', ') : data.display_name;

        if (formatted) {
          return res.json({
            success: true,
            data: {
              formattedAddress: formatted,
              street: streetPart || formatted,
              area: area || city,
              city: city || 'Local Municipality',
              state,
              postalCode,
              displayName: data.display_name,
            },
          });
        }
      }
    } catch (nominatimErr) {
      console.warn('[CivixAI Geocode] Nominatim failed, trying BigDataCloud fallback:', nominatimErr.message);
    }

    // 2. Fallback to BigDataCloud Free Reverse Geocode
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl, { signal: AbortSignal.timeout(5000) });
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const locality = bdc.locality || '';
        const city = bdc.city || '';
        const state = bdc.principalSubdivision || '';
        const country = bdc.countryName || '';

        const parts = [locality, city && city !== locality ? city : '', state, country].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(', ') : `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;

        return res.json({
          success: true,
          data: {
            formattedAddress: formatted,
            street: locality,
            area: locality,
            city: city || locality || 'Local Municipality',
            state,
            postalCode: bdc.postcode || '',
            displayName: formatted,
          },
        });
      }
    } catch (bdcErr) {
      console.warn('[CivixAI Geocode] BigDataCloud fallback failed:', bdcErr.message);
    }

    // 3. Coordinate fallback
    res.json({
      success: true,
      data: {
        formattedAddress: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
        street: '',
        area: '',
        city: 'Local Ward',
        state: '',
        postalCode: '',
      },
    });
  } catch (err) {
    console.error('[Reverse Geocode error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

