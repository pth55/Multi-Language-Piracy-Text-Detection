import React, { useState, useEffect } from "react";
import { Loader2, Send, AlertCircle, Languages, Trash } from "lucide-react";

interface PromptResult {
  id: string;
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  keywords: string[];
  timestamp: number;
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PromptResult[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("promptHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (result: PromptResult) => {
    const newHistory = [result, ...history];
    setHistory(newHistory);
    localStorage.setItem("promptHistory", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("promptHistory");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !file) {
      setError("Please enter text or select a file.");
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("text", prompt);
      }
  
      const headers: HeadersInit = file ? {} : { "Content-Type": "application/json" };
  
      const response = await fetch("https://piracy-text-be.onrender.com/process", {
        method: "POST",
        headers,
        body: file ? formData : JSON.stringify({ text: prompt }),
      });
  
      const data = await response.json();
  
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to get a valid response.");
      }
  
      const result: PromptResult = {
        id: crypto.randomUUID(),
        originalText: file ? `File: ${file.name}` : prompt,
        translatedText: data.translated_text,
        detectedLanguage: data.detected_language,
        keywords: data.keywords,
        timestamp: Date.now(),
      };
  
      saveToHistory(result);
      setPrompt("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Languages className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Multi-Language Piracy Text Detection
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Detect and analyze pirated text using advanced AI technology.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter text for analysis..."
                className="w-full p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32 shadow-sm"
                disabled={isLoading}
              />
            </div>
            <div className="mb-6 text-center">
  <label className="block text-gray-700 font-medium mb-4">
    <span className="flex items-center justify-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      OR
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </span>
  </label>
  <input
    type="file"
    accept=".pdf"
    onChange={(e) => setFile(e.target.files?.[0] || null)}
    className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition file:bg-blue-50 file:border-none file:rounded-lg file:cursor-pointer file:text-blue-600 file:py-2 file:px-4"
    disabled={isLoading}
  />
  <p className="mt-2 text-sm text-gray-500">Only PDF files are accepted.</p>
</div>

            <button
              type="submit"
              disabled={isLoading || (!prompt.trim() && !file)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyze ☺️
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Results</h2>
          <button
            onClick={clearHistory}
            className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 transition-colors"
          >
            <Trash className="w-5 h-5" />
            Clear History
          </button>
        </div>

        <div
          className={`grid grid-cols-1 ${
            history.length > 1 ? "md:grid-cols-2" : "lg:grid-cols-3"
          } gap-4 sm:gap-6`}
        >
          {history.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg shadow-sm border p-4 sm:p-6 transition-shadow ${
                item.keywords && item.keywords.length > 0
                  ? "bg-pink-50 border-pink-300 hover:shadow-md"
                  : "bg-green-50 border-green-300 hover:shadow-lg"
              }`}
            >
              <div className="text-sm mb-4">
                {new Date(item.timestamp).toLocaleString()}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Original Text:</h3>
                  <p
                    className={`break-words p-3 rounded-md ${
                      item.keywords && item.keywords.length > 0
                        ? "bg-pink-200"
                        : "bg-green-200"
                    }`}
                  >
                    {item.originalText}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Translated Text:</h3>
                  <p
                    className={`break-words p-3 rounded-md ${
                      item.keywords && item.keywords.length > 0
                        ? "bg-pink-200"
                        : "bg-green-200"
                    }`}
                  >
                    {item.translatedText}
                  </p>
                </div>

                {item.keywords && item.keywords.length > 0 ? (
                  <>
                    <div>
                      <h3 className="font-medium mb-2">Detected Keywords:</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Detected Language:</h3>
                      <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {item.detectedLanguage}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-medium mb-2">Detected Language:</h3>
                      <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {item.detectedLanguage}
                      </div>
                    </div>
                    <div className="text-blue-500 font-medium text-lg text-center">
                      This text is pirate-free! 🎉
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
