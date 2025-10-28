/**
 * Semantic Search Engine for BrowseBack
 * Implements TF-IDF embeddings and semantic understanding
 */

export class SemanticSearch {
  constructor() {
    this.vocabulary = new Map(); // Word to index mapping
    this.idf = new Map(); // Inverse document frequency
    this.documentVectors = new Map(); // Document ID to TF-IDF vector
    this.aiSession = null;
  }

  /**
   * Build vocabulary and IDF from all documents
   */
  async buildIndex(captures) {
    console.log('🔍 Building semantic search index...');

    // Step 1: Build vocabulary
    const documentFrequency = new Map();
    const totalDocs = captures.length;

    captures.forEach(capture => {
      const text = this.preprocessText(
        `${capture.title} ${capture.url} ${capture.extractedText || capture.domText || ''}`
      );
      const words = new Set(text.split(/\s+/).filter(w => w.length > 2));

      words.forEach(word => {
        if (!this.vocabulary.has(word)) {
          this.vocabulary.set(word, this.vocabulary.size);
        }
        documentFrequency.set(word, (documentFrequency.get(word) || 0) + 1);
      });
    });

    // Step 2: Calculate IDF
    this.vocabulary.forEach((index, word) => {
      const df = documentFrequency.get(word) || 1;
      this.idf.set(word, Math.log(totalDocs / df));
    });

    // Step 3: Build TF-IDF vectors for each document
    captures.forEach(capture => {
      const vector = this.buildTFIDFVector(capture);
      this.documentVectors.set(capture.id, vector);
    });

    console.log(`✅ Indexed ${totalDocs} documents with ${this.vocabulary.size} terms`);
  }

  /**
   * Preprocess text (lowercase, remove special chars, stem)
   */
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Build TF-IDF vector for a document
   */
  buildTFIDFVector(capture) {
    const text = this.preprocessText(
      `${capture.title || ''} ${capture.url || ''} ${capture.extractedText || capture.domText || ''}`
    );
    const words = text.split(/\s+/).filter(w => w.length > 2);

    // Calculate term frequency
    const tf = new Map();
    words.forEach(word => {
      tf.set(word, (tf.get(word) || 0) + 1);
    });

    // Normalize by document length
    const totalWords = words.length || 1;

    // Build sparse vector
    const vector = new Map();
    tf.forEach((count, word) => {
      if (this.vocabulary.has(word)) {
        const termFreq = count / totalWords;
        const idfValue = this.idf.get(word) || 0;
        vector.set(word, termFreq * idfValue);
      }
    });

    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    // Get all unique terms
    const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);

    allTerms.forEach(term => {
      const v1 = vec1.get(term) || 0;
      const v2 = vec2.get(term) || 0;

      dotProduct += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  /**
   * Expand query using AI for semantic understanding
   */
  async expandQuery(query) {
    try {
      if (!this.aiSession) {
        // Check if Prompt API is available (LanguageModel is the official global API)
        if (typeof window.LanguageModel === 'undefined') {
          return [query]; // Return original query if AI not available
        }

        const availability = await window.LanguageModel.availability({
          expectedInputs: [{ type: 'text', languages: ['en'] }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }]
        });
        if (availability === 'unavailable') {
          return [query];
        }

        this.aiSession = await window.LanguageModel.create({
          expectedInputs: [{ type: 'text', languages: ['en'] }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }],
          systemPrompt: 'You are a search query expansion assistant. Generate related search terms.'
        });
      }

      // Ask AI to expand the query with synonyms and related terms
      const prompt = `For the search query "${query}", provide 3-5 related search terms or synonyms that would help find similar content. Return ONLY the terms, comma-separated, no explanations.`;

      const response = await this.aiSession.prompt(prompt);

      // Parse response
      const expandedTerms = response
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
        .slice(0, 5);

      return [query, ...expandedTerms];

    } catch (error) {
      console.warn('Query expansion failed, using original query:', error);
      return [query];
    }
  }

  /**
   * Semantic search with expanded queries
   */
  async search(query, captures) {
    // Expand query with AI
    const expandedQueries = await this.expandQuery(query);
    console.log('🔍 Expanded query:', expandedQueries);

    // Build query vector from expanded terms
    const queryText = expandedQueries.join(' ');
    const queryVector = this.buildQueryVector(queryText);

    // Calculate similarity scores
    const scores = captures.map(capture => {
      const docVector = this.documentVectors.get(capture.id);
      if (!docVector) return { capture, score: 0 };

      const similarity = this.cosineSimilarity(queryVector, docVector);

      // Boost for exact matches in title/URL
      let boost = 1;
      const lowerQuery = query.toLowerCase();
      if (capture.title?.toLowerCase().includes(lowerQuery)) boost *= 1.5;
      if (capture.url?.toLowerCase().includes(lowerQuery)) boost *= 1.3;

      return {
        capture,
        score: similarity * boost * 100 // Scale to percentage
      };
    });

    // Sort by score and return captures with searchScore property
    return scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => ({
        ...s.capture,
        searchScore: s.score
      }));
  }

  /**
   * Build query vector from text
   */
  buildQueryVector(queryText) {
    const text = this.preprocessText(queryText);
    const words = text.split(/\s+/).filter(w => w.length > 2);

    const tf = new Map();
    words.forEach(word => {
      tf.set(word, (tf.get(word) || 0) + 1);
    });

    const totalWords = words.length || 1;
    const vector = new Map();

    tf.forEach((count, word) => {
      if (this.vocabulary.has(word)) {
        const termFreq = count / totalWords;
        const idfValue = this.idf.get(word) || 0;
        vector.set(word, termFreq * idfValue);
      }
    });

    return vector;
  }

  /**
   * Update index with new capture
   */
  addToIndex(capture) {
    const text = this.preprocessText(
      `${capture.title} ${capture.url} ${capture.extractedText || capture.domText || ''}`
    );
    const words = new Set(text.split(/\s+/).filter(w => w.length > 2));

    // Update vocabulary if needed
    words.forEach(word => {
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, this.vocabulary.size);
        this.idf.set(word, 1); // Will be updated on next full rebuild
      }
    });

    // Build vector for new document
    const vector = this.buildTFIDFVector(capture);
    this.documentVectors.set(capture.id, vector);
  }
}

export default SemanticSearch;
