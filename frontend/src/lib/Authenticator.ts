const IMAGEKIT_AUTH_END = import.meta.env.VITE_IMAGEKIT_AUTH_END;

const Authenticator = async () => {
  try {
    const response = await fetch(IMAGEKIT_AUTH_END);
    // const response = await fetch("http://localhost:3000/imagekit_auth");

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Authentication request failed: ${error.message}`);
    } else {
      throw new Error("Authentication request failed: Unknown error");
    }
  }
};

export default Authenticator;
