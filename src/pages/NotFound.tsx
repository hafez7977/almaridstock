import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Keep the app usable even if a user lands on an unknown deep link.
    // This commonly happens with stale bookmarks, OAuth provider redirects, or mis-typed URLs.
    document.title = "Page not found | Almarid Stock";

    const t = window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 1500);

    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-balance">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn’t find <span className="font-mono">{location.pathname}</span>. Redirecting you to
            the home page…
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/", { replace: true })}>Go to Home</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default NotFound;

