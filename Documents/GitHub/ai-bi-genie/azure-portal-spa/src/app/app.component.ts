import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthenticationService } from './core/services/authentication.service';
import { ThemeService } from './core/services/theme.service';
import { NotificationService } from './shared/services/notification.service';
import { LoadingService } from './shared/services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'AI-BI Genie Portal';
  isAuthenticated = false;
  isLoading = false;
  currentTheme = 'light';
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.initializeApp();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeApp(): void {
    // Initialize authentication
    this.authService.initializeAuth();
    
    // Initialize theme
    this.themeService.initializeTheme();
    
    // Setup global error handling
    this.setupGlobalErrorHandling();
  }

  private setupSubscriptions(): void {
    // Authentication state subscription
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        if (!isAuth && this.router.url !== '/login') {
          this.router.navigate(['/login']);
        }
      });

    // Loading state subscription
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Theme changes subscription
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
        this.applyTheme(theme);
      });

    // Router events subscription for navigation tracking
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        // Track page navigation for analytics
        this.trackPageNavigation(event.url);
      });
  }

  private applyTheme(theme: string): void {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme');
    body.classList.add(`${theme}-theme`);
  }

  private setupGlobalErrorHandling(): void {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.notificationService.showError(
        'An unexpected error occurred. Please try again.',
        'Application Error'
      );
    });

    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.notificationService.showError(
        'An unexpected error occurred. Please refresh the page.',
        'Application Error'
      );
    });
  }

  private trackPageNavigation(url: string): void {
    // Implement page navigation tracking for analytics
    // This could integrate with Application Insights or other analytics services
    console.log(`Navigation to: ${url}`);
  }

  onToggleTheme(): void {
    const currentTheme = this.themeService.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
  }

  onLogout(): void {
    this.authService.logout();
  }
}