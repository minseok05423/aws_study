export const handler = async (event, context) => {
  // Call Deepseek API with fetch
  try {
    console.log("Calling Deepseek API...");
    console.log("Received body:", event.body);

    // Parse the incoming body (it's a JSON string from API Gateway)
    const requestBody = JSON.parse(event.body);
    console.log("Parsed body:", requestBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    console.log("Deepseek responded with status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepseek API error ${response.status}: ${errorText}`);
    }

    const completion = await response.json();
    console.log("Response:", completion.choices[0].message.content);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(completion),
    };
  } catch (error) {
    console.error("Deepseek API error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: `deepseek error has occurred: ${error.message}`,
      }),
    };
  }
};
