import {
  analyzeCivicImage,
  setApiKey,
  getApiKeyStatus,
  setSimulateFailure,
  getSimulateFailure,
} from '../services/aiService.js';

export const previewAiAnalysis = async (req, res) => {
  try {
    const { imageBase64, userDescription, photoUrl } = req.body;
    let localFilePath = null;

    if (req.file) {
      localFilePath = req.file.path;
    }

    const trimmedDesc = (userDescription || '').trim();
    const hasImage = Boolean(localFilePath || imageBase64 || photoUrl);

    // TC-15: Validation appears, and unnecessary AI calls are avoided
    if (!hasImage && !trimmedDesc) {
      return res.status(400).json({
        success: false,
        validationError: true,
        error: 'Validation failed: Issue description or photo evidence is required for AI analysis. Empty requests are rejected.',
      });
    }

    const analysis = await analyzeCivicImage({
      imagePath: localFilePath,
      imageBase64: imageBase64,
      userDescription: trimmedDesc,
    });

    res.json({ success: true, data: analysis });
  } catch (err) {
    if (err.validationError) {
      return res.status(400).json({ success: false, validationError: true, error: err.message });
    }
    console.error('[CivixAI AI Controller] Preview error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAiStatus = (req, res) => {
  res.json({ success: true, ...getApiKeyStatus() });
};

export const updateAiKey = (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid API Key string is required' });
  }
  setApiKey(apiKey.trim());
  res.json({ success: true, message: 'Gemini API Key updated successfully for this session.', ...getApiKeyStatus() });
};

// TC-16: Toggle simulation of AI failure / timeout for testing
export const toggleAiFailureSimulation = (req, res) => {
  const { simulate } = req.body;
  const isSimulated = Boolean(simulate);
  setSimulateFailure(isSimulated);
  res.json({
    success: true,
    simulateFailure: getSimulateFailure(),
    message: isSimulated
      ? 'AI Service Failure Simulation ENABLED (TC-16). Cloud AI calls will simulate downtime and fallback to local civic engine.'
      : 'AI Service Failure Simulation DISABLED. Normal AI operation restored.',
  });
};
