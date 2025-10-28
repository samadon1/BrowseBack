/**
 * AI Processor Module for BrowseBack
 * Handles Chrome Prompt API integration for OCR and text extraction
 */

export class AIProcessor {
  constructor() {
    this.session = null;
    this.isAvailable = false;
  }

  /**
   * Initialize the Prompt API session
   */
  async init() {
    try {
      // Check if Prompt API is available (LanguageModel is the official global API)
      if (typeof window.LanguageModel === 'undefined') {
        console.warn('Chrome Prompt API not available');
        this.isAvailable = false;
        return false;
      }

      const availability = await window.LanguageModel.availability({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }]
      });

      if (availability === 'unavailable') {
        console.warn('Language model not available');
        this.isAvailable = false;
        return false;
      }

      // Create a session
      this.session = await window.LanguageModel.create({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        systemPrompt: 'You are an OCR assistant. Extract all visible text from images accurately. Return only the extracted text without any additional commentary.'
      });

      this.isAvailable = true;
      console.log('Prompt API initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Prompt API:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Extract text from screenshot using Prompt API
   * @param {string} screenshotDataUrl - Base64 screenshot
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromImage(screenshotDataUrl) {
    try {
      if (!this.isAvailable) {
        console.warn('Prompt API not available, skipping OCR');
        return '';
      }

      // Check if session exists, create if not
      if (!this.session) {
        await this.init();
      }

      if (!this.session) {
        return '';
      }

      // Prepare the prompt with image
      const prompt = `Extract all visible text from this screenshot. Include headings, paragraphs, buttons, links, and any other text you can see. Return only the text, organized as it appears on the page.`;

      // Note: As of the hackathon, multimodal support might require specific API format
      // This is a placeholder - actual implementation depends on API availability
      const result = await this.session.prompt(prompt, {
        image: screenshotDataUrl
      });

      return result || '';
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return '';
    }
  }

  /**
   * Process captured content with AI enhancement
   * @param {Object} capture - Capture data
   * @returns {Promise<Object>} Enhanced capture data
   */
  async processCapture(capture) {
    try {
      // Extract text from screenshot using OCR
      const extractedText = await this.extractTextFromImage(capture.screenshot);

      return {
        ...capture,
        extractedText: extractedText || capture.domText || '',
        processedAt: Date.now()
      };
    } catch (error) {
      console.error('Error processing capture:', error);
      return capture;
    }
  }

  /**
   * Clean up resources
   */
  async destroy() {
    if (this.session) {
      try {
        await this.session.destroy();
      } catch (error) {
        console.error('Error destroying session:', error);
      }
      this.session = null;
    }
  }

  /**
   * Check API availability
   * @returns {boolean} True if API is available
   */
  checkAvailability() {
    return this.isAvailable;
  }
}

export default AIProcessor;
