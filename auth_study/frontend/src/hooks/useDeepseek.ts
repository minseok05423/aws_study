import { useState } from "react";

const useDeepseekAPI = () => {
  const [deepseekError, setDeepseekError] = useState<string | null>(null);
  const [deepseekLoading, setDeepseekLoading] = useState<boolean>(false);

  const CallDeepseek = async (token: string) => {
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
                  "Generate 5 deeper, more specific keywords about the target topic. Avoid repeating any words from the context. Output only keywords separated by commas.",
              },
              {
                role: "user",
                content: "give me data on south korea",
              },
            ],
            model: "deepseek-chat",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Deepseek API error: ${response.status}`);
      }
      const completion = await response.json();
      return completion;
    } catch (error) {
      const message =
        error instanceof Error ? error : "unknown error has occured";
      console.log(message);
    }
  };

  return { CallDeepseek, deepseekError, deepseekLoading };
};

export default useDeepseekAPI;
