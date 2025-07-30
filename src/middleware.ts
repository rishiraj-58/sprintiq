import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', // Make the homepage public
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/api/webhooks/clerk'
]);

export default clerkMiddleware((auth, req) => {
  // Protect all routes that are not public
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};