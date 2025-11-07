import { useState } from "react";

const useDeepseekAPI = () => {
  const [deepseekError, setDeepseekError] = useState<string | null>(null);
  const [deepseekLoading, setDeepseekLoading] = useState<boolean>(false);

  const CallDeepseek = async (token: string, maxTokens: number = 256) => {
    setDeepseekError(null);
    setDeepseekLoading(true);

    try {
      const response = await fetch(
        "https://4iy42lphh8.execute-api.ap-northeast-2.amazonaws.com/dev/deepseek",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "be smart and concise when answering the user's questions.",
              },
              {
                role: "user",
                content: "give me data on south korea",
              },
            ],
            model: "deepseek-chat",
            max_tokens: maxTokens,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Deepseek API error: ${response.status}`);
      }
      const completion = await response.json();
      setDeepseekLoading(false);
      return completion;
    } catch (error) {
      const message =
        error instanceof Error ? error : "unknown error has occured";
      console.log(message);
      setDeepseekLoading(false);
    }
  };

  return { CallDeepseek, deepseekError, deepseekLoading };
};

export default useDeepseekAPI;
