window.PADDLE_CLIENT_TOKEN = "test_4d9ba9a79a08c8147793a0da56c"; // keep your real token here
window.PADDLE_PRICE_ID = "pri_01kz0rgecs190vx3fwvz37bwd7"; // keep your real price ID here
window.PADDLE_ENVIRONMENT = "sandbox";

console.log("DEBUG: window.Paddle exists?", !!window.Paddle);
console.log("DEBUG: token looks real?", !window.PADDLE_CLIENT_TOKEN.includes("test_4d9ba9a79a08c8147793a0da56c"));

if (window.Paddle && !window.PADDLE_CLIENT_TOKEN.includes("PASTE_YOUR")) {
  console.log("DEBUG: entering the Initialize block now...");
  try {
    Paddle.Environment.set(window.PADDLE_ENVIRONMENT);
    console.log("DEBUG: Environment.set succeeded");
    Paddle.Initialize({
      token: window.PADDLE_CLIENT_TOKEN,
      eventCallback: function (data) {
        if (data.name === "checkout.completed" && typeof handlePaddleCheckoutCompleted === "function") {
          handlePaddleCheckoutCompleted();
        }
      },
    });
    console.log("DEBUG: Paddle.Initialize call completed with no error");
  } catch (err) {
    console.error("DEBUG: Paddle.Initialize THREW an error:", err);
  }
} else {
  console.log("DEBUG: the if-condition was FALSE, so Initialize was never even attempted");
}