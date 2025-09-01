import { Injector, TemplateRef, Component, OnInit, AfterViewInit, HostListener, ViewChildren, QueryList, ViewChild, ElementRef, OnDestroy, NgZone } from '@angular/core';
import { PostService } from '../../services/post.service';
import { PostDTO, PostWithOptions } from '../../models/post-dto';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Like } from 'src/app/models/like';
import { LikeService } from 'src/app/services/like.service';
import { Comment } from 'src/app/models/comment';
import { CommentService } from '../../services/comment.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css', './comments.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})

export class PostsComponent implements OnInit, AfterViewInit, OnDestroy {

  // ==========================================
  // COMPONENT STATE PROPERTIES
  // ==========================================

  // Core post data and UI state
  postDTO: PostDTO[] = [];
  loading = false;
  error: string | null = null;
  expandedComments: Set<number> = new Set();

  // Subscription to new post events
  private newPostSubscription: Subscription | null = null;

  // DOM references and animation observers
  @ViewChildren('postCard') postCards!: QueryList<ElementRef>;
  private intersectionObserver!: IntersectionObserver | null;  // Handles card entrance animations
  private flyoutObserver!: IntersectionObserver | null;        // Handles card exit animations
  private viewportHeight = (typeof window !== 'undefined') ? window.innerHeight : 0;  // Cached viewport size
  private observedSet = new WeakSet<Element>();        // Tracks elements added to main observer
  private flyoutObservedSet = new WeakSet<Element>(); // Tracks elements added to flyout observer

  // Pre-bound callbacks to avoid closure re-creation
  private observerCallback: IntersectionObserverCallback;
  private flyoutCallback: IntersectionObserverCallback;

  // Scroll-based recheck functionality for animation state synchronization
  private scrollTimeout: any = null;
  private isRecheckingCards = false; // Prevent recursive calls during recheck
  private lastRecheckTime = 0; // Prevent too frequent rechecks
  private recentlyAdjustedCards = new WeakSet<Element>(); // Track recently corrected cards
  private scrollRecheckEnabled = true; // Allow disabling the recheck system if needed

  constructor(
    private likeService: LikeService,
    private postService: PostService,
    private commentService: CommentService,
    private ngZone: NgZone,
  ) {
    // Pre-bind callbacks once to reduce memory churn during re-renders
    this.observerCallback = this.handleIntersect.bind(this);
    this.flyoutCallback = this.handleFlyoutIntersect.bind(this);
    this.setupViewportTracking();
    this.setupScrollRecheck();
  }

  // ==========================================
  // LIFECYCLE METHODS
  // ==========================================

  ngOnInit() {
    this.loadPosts();

    // Listen for new posts created from other components
    this.newPostSubscription = this.postService.postCreated$.subscribe((newPost: PostDTO) => {
      console.log('Received new post:', newPost);
      console.log('Post structure:', {
        hasPost: !!newPost.post,
        hasUser: !!(newPost.post && newPost.post.user),
        hasLikes: !!newPost.likes,
        hasComments: !!newPost.comments,
        postContent: newPost.post && newPost.post.content,
        userName: newPost.post && newPost.post.user && newPost.post.user.username
      });
      console.log('Full new post object:', JSON.stringify(newPost, null, 2));

      // Add the new post to the beginning of the array
      this.postDTO.unshift(newPost);

      // Trigger animations for the new post after DOM updates
      setTimeout(() => {
        this.observeNewPostCardsStaggered();
        this.triggerInitialAnimations();
      }, 120);
    });
  }

  /**
   * Sets up throttled viewport height caching for smooth animations
   */
  private setupViewportTracking(): void {
    if (typeof window !== 'undefined') {
      let rafId: number | null = null;
      const onResize = () => {
        if (rafId != null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          this.viewportHeight = window.innerHeight;
          rafId = null;
        });
      };
      window.addEventListener('resize', onResize, { passive: true });
      // Store cleanup reference for proper disposal
      (this as any)._resizeCleanup = () => window.removeEventListener('resize', onResize);
    }
  }



  /**
   * Sets up debounced scroll-based animation state verification.
   * Ensures animation consistency when intersection observers might miss events.
   */
  private setupScrollRecheck(): void {
    if (typeof window !== 'undefined') {
      const onScroll = () => {
        // Skip if recheck is disabled or already rechecking to prevent recursive calls
        if (!this.scrollRecheckEnabled || this.isRecheckingCards) return;

        // Clear previous timeout and set new one
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          this.ngZone.runOutsideAngular(() => this.recheckAllCardStates());
        }, 150); // 150ms debounce - balanced between responsiveness and performance
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      // Store cleanup reference for proper disposal
      (this as any)._scrollCleanup = () => window.removeEventListener('scroll', onScroll);
    }
  }

  ngAfterViewInit() {
    // Initialize both animation observers
    this.initObserver();
    this.initFlyoutObserver();

    // Set up automatic observation when new cards are added
    this.postCards.changes.subscribe(() => {
      this.observeNewPostCardsStaggered();
    });

    // Observe initial cards after DOM settles
    setTimeout(() => this.observeNewPostCardsStaggered(), 100);
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.newPostSubscription) {
      this.newPostSubscription.unsubscribe();
    }

    // Clean up all observers and event listeners to prevent memory leaks
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    if (this.flyoutObserver) {
      this.flyoutObserver.disconnect();
      this.flyoutObserver = null;
    }
    if ((this as any)._resizeCleanup) {
      (this as any)._resizeCleanup();
    }
    if ((this as any)._scrollCleanup) {
      (this as any)._scrollCleanup();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  // ==========================================
  // INTERSECTION OBSERVER SETUP
  // ==========================================

  /**
   * Sets up the main intersection observer for card entrance animations.
   * Triggers when cards first come into view to start their entrance animation.
   * Uses percentage-based rootMargin for better responsiveness across device sizes.
   */
  private initObserver() {
    this.ngZone.runOutsideAngular(() => {
      this.intersectionObserver = new IntersectionObserver(this.observerCallback, {
        threshold: 0.15,        // Trigger when 15% of card is visible (corrected from 0.12)
        rootMargin: '10% 0% 10% 0%'  // Start observing 10% of viewport height before/after card enters
      });
    });
  }

  /**
   * Pre-bound callback for main intersection observer
   * Batches DOM writes in requestAnimationFrame for optimal performance
   */
  private handleIntersect(entries: IntersectionObserverEntry[]): void {
    requestAnimationFrame(() => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const index = element.getAttribute('data-index');

        console.log(`Main observer triggered for card ${index}, isIntersecting: ${entry.isIntersecting}, hasAnimateIn: ${element.classList.contains('animate-in')}`);

        if (entry.isIntersecting && !element.classList.contains('animate-in')) {
          console.log(`Triggering safeAddAnimateIn for card ${index}`);
          this.safeAddAnimateIn(element);
        }
      }
    });
  }

  // ==========================================
  // CARD STATE CHANGE HANDLERS
  // ==========================================

  /**
   * Central handler for all card state transitions.
   * Prevents simultaneous animations and routes to appropriate handlers.
   */
  private handleCardStateChange(
    element: HTMLElement,
    newState: string,
    previousState: string,
    cardState: any,
    rect: DOMRect
  ): void {
    // Prevent state changes during active animations
    if (element.hasAttribute('data-animating') || element.hasAttribute('data-flyout-animating')) {
      return;
    }

    switch (newState) {
      case 'entering':
        this.handleCardEntering(element, rect);
        break;

      case 'visible':
        this.handleCardVisible(element);
        break;

      case 'flyout':
        this.handleCardFlyout(element, cardState, rect);
        break;

      case 'hidden':
        // Card completely out of view - no action needed
        break;
    }
  }

  /**
   * Handles cards entering the viewport.
   * Chooses between standard or bottom entrance animation based on position.
   */
  private handleCardEntering(element: HTMLElement, rect: DOMRect): void {
    // Clean up any existing flyout classes
    element.classList.remove('animate-out-left', 'animate-out-right', 'animate-out-bottom', 'flyout-trigger', 'loaded');

    // Choose entrance animation based on how far down the viewport the card appears
    if (rect.top > this.viewportHeight * 0.35) {
      this.safeAddAnimateInFromBottom(element);  // Cards appearing lower in viewport slide up
    } else {
      this.safeAddAnimateIn(element);            // Cards appearing higher use standard fade-in
    }
  }

  /**
   * Handles cards that have finished their entrance animation.
   * Marks them as loaded and ready for potential flyout animation.
   */
  private handleCardVisible(element: HTMLElement): void {
    // Complete the entrance animation sequence
    if (element.classList.contains('animate-in') || element.classList.contains('animate-in-from-bottom')) {
      element.classList.remove('animate-in', 'animate-in-from-bottom');
      element.classList.add('loaded');
    }
  }

  /**
   * Handles cards that should fly out when leaving the viewport.
   * Applies directional flyout animation based on card position and index.
   */
  private handleCardFlyout(element: HTMLElement, cardState: any, rect: DOMRect): void {
    // Skip if already has a flyout animation applied
    if (element.classList.contains('animate-out-left') ||
        element.classList.contains('animate-out-right') ||
        element.classList.contains('animate-out-bottom')) {
      return;
    }

    const flyoutClass = this.getFlyoutClass(rect, cardState.isEven);
    if (flyoutClass) {
      // Lock element during flyout animation to prevent interference
      element.setAttribute('data-flyout-animating', 'true');

      // Apply the appropriate flyout animation
      this.safeTriggerFlyout(element, flyoutClass);
      element.classList.add('flyout-trigger');

      // Release animation lock after completion
      setTimeout(() => {
        element.removeAttribute('data-flyout-animating');
      }, 600);
    }
  }

  /**
   * Sets up the flyout intersection observer for exit animations.
   * Triggers when cards leave the viewport to start their exit animation.
   * Uses percentage-based rootMargin for consistent behavior across device sizes.
   */
  private initFlyoutObserver() {
    this.ngZone.runOutsideAngular(() => {
      this.flyoutObserver = new IntersectionObserver(this.flyoutCallback, {
        threshold: [0.8, 0.85, 0.9],    // Multiple thresholds for precise detection
        rootMargin: '-10% 0% -10% 0%'   // Create smaller detection area (10% margin) for cleaner flyouts
      });
    });
  }

  /**
   * Pre-bound callback for flyout intersection observer
   * Batches DOM writes in requestAnimationFrame for optimal performance
   */
  private handleFlyoutIntersect(entries: IntersectionObserverEntry[]): void {
    requestAnimationFrame(() => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const index = element.getAttribute('data-index');
        const rect = entry.boundingClientRect;

        console.log(`Flyout observer triggered for card ${index}:`, {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio.toFixed(3),
          elementTop: rect.top.toFixed(1),
          elementBottom: rect.bottom.toFixed(1),
          viewportHeight: this.viewportHeight,
          hasAnimateIn: element.classList.contains('animate-in'),
          hasLoaded: element.classList.contains('loaded'),
          hasAnimateOut: element.classList.contains('animate-out-left') ||
                       element.classList.contains('animate-out-right') ||
                       element.classList.contains('animate-out-bottom')
        });

        // Trigger flyout when card is no longer intersecting (leaving viewport)
        if (!entry.isIntersecting) {
          this.onFlyoutIntersect(element, entry);
        }
      }
    });
  }

  /**
   * Handles the actual flyout animation when a card leaves the viewport.
   * Determines direction based on card position and applies appropriate animation.
   */
  private onFlyoutIntersect(element: HTMLElement, entry: IntersectionObserverEntry) {
    const indexAttr = element.getAttribute('data-index');

    // Skip if already animating out
    if (element.classList.contains('animate-out-left') ||
        element.classList.contains('animate-out-right') ||
        element.classList.contains('animate-out-bottom')) {
      return;
    }

    // Only animate cards that have completed their entrance animation
    if (!element.classList.contains('animate-in') && !element.classList.contains('loaded')) {
      console.log(`Skipping flyout for card ${indexAttr} - no animate-in or loaded class. Classes:`, element.className);
      return;
    }

    // Use pre-calculated rect from intersection observer to avoid layout thrashing
    const rect = entry.boundingClientRect as DOMRect;
    const index = indexAttr ? parseInt(indexAttr, 10) : 0;
    const isEven = index % 2 === 0;

    const flyoutClass = this.getFlyoutClass(rect, isEven);
    if (flyoutClass) {
      // Debug logging for troubleshooting flyout behavior
      const elementCenterY = rect.top + (rect.height / 2);
      const viewportCenterY = this.viewportHeight / 2;
      console.log(`Flyout triggered for card ${index} (${isEven ? 'even' : 'odd'}): ${flyoutClass}, elementCenterY: ${elementCenterY}, viewportCenterY: ${viewportCenterY}`);

      element.classList.add('flyout-trigger', flyoutClass);
    }
  }

  // ==========================================
  // ANIMATION UTILITIES
  // ==========================================

  /**
   * Unified animation method that safely applies CSS classes and handles transitions.
   * Prevents duplicate animations and provides completion callbacks.
   */
  private safeAnimate(
    el: HTMLElement,
    addClass: string,
    removeClasses: string[],
    onComplete?: () => void
  ): void {
    // Prevent duplicate animations
    if (el.classList.contains(addClass)) return;

    // Lock element during animation
    el.setAttribute('data-animating', 'true');
    el.classList.remove(...removeClasses);
    el.classList.add(addClass);

    // Set up completion handler
    this.onceTransitionEnds(el, () => {
      el.removeAttribute('data-animating');
      if (onComplete) onComplete();
    });
  }

  /**
   * Determines the appropriate flyout direction based on card position.
   * Even/odd cards alternate left/right, cards in lower half exit downward.
   */
  private getFlyoutClass(rect: DOMRect, isEven: boolean): string {
    const elementCenterY = rect.top + (rect.height / 2);
    const viewportCenterY = this.viewportHeight / 2;

    if (elementCenterY < viewportCenterY) {
      // Element in upper half - alternate left/right based on even/odd index
      return isEven ? 'animate-out-left' : 'animate-out-right';
    } else {
      // Element in lower half - always exit downward regardless of index
      return 'animate-out-bottom';
    }
  }

  /**
   * Adds card elements to the flyout observer after entrance animation completes.
   * Uses NgZone optimization to avoid unnecessary change detection.
   */
  private addToFlyoutObserver(el: HTMLElement): void {
    if (this.flyoutObserver && !this.flyoutObservedSet.has(el)) {
      this.ngZone.runOutsideAngular(() => {
        this.flyoutObserver!.observe(el);
        this.flyoutObservedSet.add(el);
        console.log(`Adding card ${el.getAttribute('data-index')} to flyout observer after animation transition`);
      });
    }
  }

  // ==========================================
  // SPECIFIC ANIMATION METHODS
  // ==========================================

  /**
   * Triggers standard entrance animation (fade-in with scale).
   * Used for cards appearing in the upper portion of the viewport.
   */
  private safeAddAnimateIn(el: HTMLElement): void {
    this.safeAnimate(
      el,
      'animate-in',
      ['animate-out-left', 'animate-out-right', 'animate-out-bottom', 'loaded', 'animate-in-from-bottom'],
      () => {
        // Animation complete - transition to loaded state and enable flyout observer
        el.classList.remove('animate-in-from-bottom'); // Ensure cleanup
        el.classList.remove('animate-in');
        el.classList.add('loaded');
        this.addToFlyoutObserver(el);
      }
    );
  }

  /**
   * Triggers bottom entrance animation (slide up from bottom).
   * Used for cards appearing in the lower portion of the viewport.
   */
  private safeAddAnimateInFromBottom(el: HTMLElement): void {
    this.safeAnimate(
      el,
      'animate-in-from-bottom',
      ['animate-out-left', 'animate-out-right', 'animate-out-bottom', 'loaded', 'animate-in'],
      () => {
        // Animation complete - transition to loaded state and enable flyout observer
        el.classList.remove('animate-in-from-bottom');
        el.classList.add('loaded');
        this.addToFlyoutObserver(el);
      }
    );
  }

  /**
   * Triggers flyout animation in the specified direction.
   * No completion callback needed as flyout animations are final.
   */
  private safeTriggerFlyout(el: HTMLElement, outClass: string): void {
    this.safeAnimate(
      el,
      outClass,
      ['animate-in', 'animate-in-from-bottom', 'loaded']
      // No onComplete callback - flyout animations don't need post-processing
    );
  }

  /**
   * Sets up transition end listener with automatic cleanup and safety fallback.
   * Ensures animation locks are always released even if transitionend doesn't fire.
   */
  private onceTransitionEnds(el: HTMLElement, callback: () => void): void {
    const handler = (ev: Event) => {
      // Execute callback once per element regardless of which CSS property triggered the event
      callback();
    };

    // Listen for transition completion
    el.addEventListener('transitionend', handler, { once: true });

    // Safety fallback: release animation lock after maximum expected duration
    // Prevents permanent locks if transitionend doesn't fire (e.g., element removed from DOM)
    setTimeout(() => {
      if (el.hasAttribute('data-animating')) {
        el.removeAttribute('data-animating');
      }
    }, 800);
  }

  // ==========================================
  // SCROLL-BASED ANIMATION STATE VERIFICATION
  // ==========================================

  /**
   * Enable or disable the scroll-based animation recheck system.
   * Useful for debugging or if the recheck system causes issues.
   */
  public toggleScrollRecheck(enabled: boolean): void {
    this.scrollRecheckEnabled = enabled;
    console.log(`🔄 Scroll recheck system ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Debounced function that verifies and corrects animation states after scrolling stops.
   * Enhanced with repetition prevention and conservative correction logic.
   */
  private recheckAllCardStates(): void {
    // Prevent recursive calls, unnecessary work, and too frequent rechecks
    const now = Date.now();
    if (this.isRecheckingCards || !this.postCards || this.postCards.length === 0 ||
        (now - this.lastRecheckTime) < 200) { // Minimum 200ms between rechecks
      return;
    }

    this.isRecheckingCards = true;
    this.lastRecheckTime = now;
    console.log('🔄 Rechecking animation states for', this.postCards.length, 'cards');

    try {
      // Cache viewport dimensions to avoid repeated calculations
      const viewportHeight = this.viewportHeight || window.innerHeight;
      const viewportTop = window.pageYOffset || document.documentElement.scrollTop;
      const viewportBottom = viewportTop + viewportHeight;

      // Batch process all cards to minimize layout thrashing
      requestAnimationFrame(() => {
        let correctionsMade = 0;

        this.postCards.forEach((cardRef, index) => {
          const element = cardRef.nativeElement as HTMLElement;

          // Skip elements that are currently animating, recently adjusted, or in transition
          if (element.hasAttribute('data-animating') ||
              element.hasAttribute('data-flyout-animating') ||
              this.recentlyAdjustedCards.has(element)) {
            return;
          }

          // Get current element position (this is the only getBoundingClientRect call per card)
          const rect = element.getBoundingClientRect() as DOMRect;
          const elementTop = rect.top + viewportTop;
          const elementBottom = rect.bottom + viewportTop;

          // Determine what the correct state should be
          const isInViewport = elementBottom > viewportTop && elementTop < viewportBottom;
          const isPartiallyVisible = rect.bottom > 50 && rect.top < (viewportHeight - 50); // More conservative visibility

          // Get current animation classes
          const hasAnimateIn = element.classList.contains('animate-in');
          const hasAnimateInFromBottom = element.classList.contains('animate-in-from-bottom');
          const hasLoaded = element.classList.contains('loaded');
          const hasAnyFlyout = element.classList.contains('animate-out-left') ||
                              element.classList.contains('animate-out-right') ||
                              element.classList.contains('animate-out-bottom');

          // More conservative correction logic - only fix obvious mismatches
          let needsCorrection = false;
          let correctionAction = '';

          // Only correct cards that are clearly in wrong state
          if (isPartiallyVisible && !hasAnimateIn && !hasAnimateInFromBottom && !hasLoaded && !hasAnyFlyout) {
            // Card is clearly visible but completely unanimated - safe to fix
            needsCorrection = true;
            correctionAction = 'trigger-entrance';
          } else if (!isPartiallyVisible && hasLoaded && !hasAnyFlyout && rect.bottom < -100) {
            // Card is completely out of view (100px past top) but still loaded - safe flyout
            needsCorrection = true;
            correctionAction = 'trigger-flyout';
          }
          // Remove the problematic "reset-to-entrance" logic that was causing repetition

          // Apply corrections if needed, but mark card to prevent immediate re-correction
          if (needsCorrection) {
            correctionsMade++;
            this.recentlyAdjustedCards.add(element);

            // Clear the "recently adjusted" flag after animation completion
            setTimeout(() => {
              this.recentlyAdjustedCards.delete(element);
            }, 1000);

            console.log(`🔧 Correcting card ${index}: ${correctionAction}`, {
              isInViewport,
              isPartiallyVisible,
              hasAnimateIn,
              hasAnimateInFromBottom,
              hasLoaded,
              hasAnyFlyout,
              elementTop: elementTop.toFixed(1),
              elementBottom: elementBottom.toFixed(1),
              viewportTop: viewportTop.toFixed(1),
              viewportBottom: viewportBottom.toFixed(1)
            });

            this.applyCorrectionAction(element, correctionAction, index, rect);
          }
        });

        if (correctionsMade > 0) {
          console.log(`✅ Animation state recheck completed: ${correctionsMade} corrections applied`);
        }

        this.isRecheckingCards = false;
      });

    } catch (error) {
      console.error('Error during animation state recheck:', error);
      this.isRecheckingCards = false;
    }
  }  /**
   * Applies the determined correction action to fix animation state mismatches.
   * Uses existing animation methods to maintain consistency with the main animation system.
   */
  private applyCorrectionAction(element: HTMLElement, action: string, index: number, rect: DOMRect): void {
    switch (action) {
      case 'trigger-entrance':
        // Remove any conflicting classes first
        element.classList.remove('animate-out-left', 'animate-out-right', 'animate-out-bottom', 'flyout-trigger');

        // Choose appropriate entrance animation based on position
        if (rect.top > this.viewportHeight * 0.35) {
          this.safeAddAnimateInFromBottom(element);
        } else {
          this.safeAddAnimateIn(element);
        }
        break;

      case 'trigger-flyout':
        // Only apply flyout if element has completed entrance animation
        if (element.classList.contains('loaded')) {
          const isEven = index % 2 === 0;
          const flyoutClass = this.getFlyoutClass(rect, isEven);
          if (flyoutClass) {
            this.safeTriggerFlyout(element, flyoutClass);
            element.classList.add('flyout-trigger');
          }
        }
        break;

      // Removed problematic 'reset-to-entrance' case that was causing animation repetition

      default:
        console.warn(`Unknown correction action: ${action}`);
    }
  }

  // ==========================================
  // CARD OBSERVATION MANAGEMENT
  // ==========================================

  /**
   * Observes new post cards with staggered timing for smooth visual flow.
   * Uses enhanced batching and NgZone optimization for better performance.
   */
  private observeNewPostCardsStaggered(): void {
    if (!this.postCards || !this.intersectionObserver) return;

    this.ngZone.runOutsideAngular(() => {
      const elementsToObserve: HTMLElement[] = [];

      // Batch DOM reads first
      this.postCards.forEach((card, idx) => {
        const el = card.nativeElement as HTMLElement;
        el.setAttribute('data-index', idx.toString());

        // Only collect elements that aren't already being observed
        if (!this.observedSet.has(el)) {
          elementsToObserve.push(el);
          this.observedSet.add(el);
        }
      });

      // Batch DOM writes in requestAnimationFrame with staggered timing
      if (elementsToObserve.length > 0) {
        requestAnimationFrame(() => {
          elementsToObserve.forEach((el, i) => {
            setTimeout(() => {
              if (this.intersectionObserver) {
                this.intersectionObserver.observe(el);
              }
            }, i * 40);
          });
        });
      }
    });
  }

  /**
   * Placeholder for manual animation triggers.
   * All animation triggering is now handled by intersection observers to avoid layout thrashing.
   */
  private triggerInitialAnimations(): void {
    // All visibility detection and animation triggering is handled by intersection observers
    // This eliminates manual getBoundingClientRect() calls that cause layout thrashing
  }

  // ==========================================
  // DATA LOADING AND CORE FUNCTIONALITY
  // ==========================================

  /**
   * Loads all posts from the service and initializes animations.
   * Sets up staggered card observation after DOM updates.
   */

  // In your component
  loadPosts(): void {
    this.loading = true;
    this.error = null;

    this.postService.getAllPosts().subscribe(
      (postDTO: PostDTO[]) => {
        this.postDTO = postDTO;
        this.loading = false;

        // Initialize card observation after DOM updates with timing buffer
        setTimeout(() => {
          this.observeNewPostCardsStaggered();
          this.triggerInitialAnimations();
        }, 120);
      },
      (error) => {
        this.error = 'Failed to load posts';
        this.loading = false;
        console.error('Error loading posts:', error);
      }
    );
  }

 // Reference all post action elements in the template
@ViewChildren('postActions') postActionsList!: QueryList<ElementRef>;

@HostListener('document:click', ['$event'])
onDocumentClick(event: Event) {
  const target = event.target as HTMLElement;

  // Close comment options if clicking outside
  if (!target.closest('.comment-actions-wrapper')) {
    this.postDTO.forEach(post => {
      if (post.comments) {
        post.comments.forEach(comment => {
          comment.showOptions = false;
        });
      }
    });
  }

  // Close post options if clicking outside
  if (!target.closest('.post-actions-wrapper')) {
    this.postDTO.forEach(post => {
      post.showOptions = false;
    });
  }
}

closeAllOptions() {
  // Use a safe type for showOptions without polluting PostDTO globally
  this.postDTO.forEach(post => {
    (post as PostWithOptions).showOptions = false;
  });
}

togglePostOptions(post: PostDTO) {
  (post as PostWithOptions).showOptions = !(post as PostWithOptions).showOptions;
  console.log('Toggled post options for:', post.post.id, 'Now:', (post as PostWithOptions).showOptions);
}
  // Your existing methods
  openShareOptions(post: any) { console.log('Share', post); }

  editPost(post: PostDTO) {
    console.log('Edit post:', post);
    this.editingPostId = post.post.id;
    this.editPostContent = post.post.content;
    // Close the options menu
    (post as PostWithOptions).showOptions = false;
  }
  // deletePost(post: any) { console.log('Delete', post); }

  deletePost(post: PostDTO): void {
  if (!post || !post.post.id) return;

  // Optionally confirm with the user
  if (!confirm('Are you sure you want to delete this post?')) return;

  // Call the service
  this.postService.deletePost(Number(post.post.id)).subscribe({
    next: () => {
      // Remove from frontend list so UI updates immediately
      this.postDTO = this.postDTO.filter(p => p.post.id !== post.post.id);
      console.log('Post deleted successfully');
    },
    error: (err) => {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Check console for details.');
    }
  });
}
  addComment(postId: number, commentContent: string): void {
  if (!commentContent || commentContent.trim() === '') return;

  // Find the post DTO by ID
  const postDTO = this.postDTO.find(p => Number(p.post.id) === postId);
  if (!postDTO) return;

  // Build the new comment object
  const newComment = {
    id: -Date.now(), // Temporary negative ID for frontend-only comment
    postId: Number(postDTO.post.id),
    content: commentContent.trim(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      id: Number(this.getCurrentUserId()), // Make sure this is a number
      username: 'Current User',            // Replace with actual current user
      role: 'user',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  // Initialize comments array if it doesn't exist
  postDTO.comments = postDTO.comments ? postDTO.comments : [];
  postDTO.comments.push(newComment);

  // Clear input or reset form as needed
  // commentContent = '';
}




  // ==========================================
  // UI UTILITY METHODS
  // ==========================================

  /**
   * Formats current date for display.
   */
  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // ==========================================
  // COMMENT METHODS
  // ==========================================

  /**
   * Toggles comment visibility for a specific post.
   */
  toggleComments(postId: number) {
    if (this.expandedComments.has(postId)) {
      this.expandedComments.delete(postId);
    } else {
      this.expandedComments.add(postId);
    }
  }

  /**
   * Checks if comments are expanded for a specific post.
   */
  isCommentsExpanded(postId: number): boolean {
    return this.expandedComments.has(postId);
  }

  /**
   * Toggle comment options menu
   */
  toggleCommentOptions(comment: Comment, event?: Event) {
    console.log('toggleCommentOptions called', comment);

    // Close all other comment options first
    this.postDTO.forEach(post => {
      if (post.comments) {
        post.comments.forEach(c => {
          if (c !== comment) {
            c.showOptions = false;
          }
        });
      }
    });

    // Toggle the clicked comment
    comment.showOptions = !comment.showOptions;
    console.log('Comment showOptions set to:', comment.showOptions);
  }

  /**
   * Share comment functionality
   */
  shareComment(comment: Comment) {
    // Implement share functionality
    console.log('Share comment:', comment);
  }

  /**
   * Edit comment functionality
   */
  editComment(comment: Comment) {
    console.log('Edit comment:', comment);
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
    // Close the options menu
    comment.showOptions = false;
  }

  /**
   * Save post edit functionality
   */
  savePostEdit(post: PostDTO) {
    if (!this.editPostContent.trim()) {
      return;
    }

    this.submittingPostEdit = true;

    // Send only the content that needs to be updated
    const updateData = {
      content: this.editPostContent.trim()
    };

    this.postService.updatePost(post.post.id, updateData).subscribe({
      next: (updatedPostDTO) => {
        console.log('Post update response:', updatedPostDTO);
        // Update the local post content with the returned data
        if (updatedPostDTO && updatedPostDTO.post) {
          post.post.content = updatedPostDTO.post.content;
          if (updatedPostDTO.post.updatedAt) {
            post.post.updatedAt = updatedPostDTO.post.updatedAt;
          }
        } else {
          // Fallback to manual content update if response structure is different
          post.post.content = this.editPostContent.trim();
        }
        this.cancelPostEdit();
        console.log('Post updated successfully');
      },
      error: (err) => {
        console.error('Error updating post:', err);
        alert('Failed to update post. Please try again.');
        this.submittingPostEdit = false;
      }
    });
  }

  /**
   * Cancel post edit functionality
   */
  cancelPostEdit() {
    console.log('Cancelling post edit, resetting flags');
    this.editingPostId = null;
    this.editPostContent = '';
    this.submittingPostEdit = false;
  }

  /**
   * Save comment edit functionality
   */
  saveCommentEdit(comment: Comment) {
    if (!this.editCommentContent.trim()) {
      return;
    }

    this.submittingCommentEdit = true;

    // Send only the content that needs to be updated
    const updateData = {
      content: this.editCommentContent.trim()
    };

    this.commentService.updateComment(comment.id, updateData).subscribe({
      next: (updatedComment) => {
        console.log('Comment update response:', updatedComment);
        // Update the local comment content with the returned data
        if (updatedComment && updatedComment.content) {
          comment.content = updatedComment.content;
          if (updatedComment.updatedAt) {
            comment.updatedAt = updatedComment.updatedAt;
          }
        } else {
          // Fallback to manual content update if response structure is different
          comment.content = this.editCommentContent.trim();
        }
        this.cancelCommentEdit();
        console.log('Comment updated successfully');
      },
      error: (err) => {
        console.error('Error updating comment:', err);
        alert('Failed to update comment. Please try again.');
        this.submittingCommentEdit = false;
      }
    });
  }

  /**
   * Cancel comment edit functionality
   */
  cancelCommentEdit() {
    console.log('Cancelling comment edit, resetting flags');
    this.editingCommentId = null;
    this.editCommentContent = '';
    this.submittingCommentEdit = false;
  }

  /**
   * Check if a post is currently being edited
   */
  isEditingPost(postId: number): boolean {
    return this.editingPostId === postId;
  }

  /**
   * Check if a comment is currently being edited
   */
  isEditingComment(commentId: number): boolean {
    return this.editingCommentId === commentId;
  }

  /**
   * Delete comment functionality
   */
deleteComment(comment: Comment) {
  console.log('Attempting to delete comment:', comment.id);

  this.commentService.deleteComment(comment.id).subscribe({
    next: () => {
      // Mark comment as inactive (soft delete)
      comment.active = false;
      comment.showOptions = false;

      // Force Angular change detection by creating a new array reference
      this.postDTO = this.postDTO.map(post => {
        if (post.comments) {
          // Filter out inactive comments or just update the existing array
          post.comments = [...post.comments];
        }
        return post;
      });

      console.log('Comment successfully marked as inactive');
    },
    error: (err) => {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment. Please try again.');
    }
  });
}

  /**
   * Get the count of active comments for a post
   */
  getActiveCommentsCount(comments: Comment[]): number {
    if (!comments) return 0;
    return comments.filter(comment => comment.active).length;
  }

  /**
   * Get only active comments for a post
   */
  getActiveComments(comments: Comment[]): Comment[] {
    if (!comments) return [];
    return comments.filter(comment => comment.active);
  }

  newCommentText: { [key: string]: string } = {};
  submittingComment: { [key: string]: boolean } = {};

  // Edit state management
  editingPostId: number | null = null;
  editingCommentId: number | null = null;
  editPostContent: string = '';
  editCommentContent: string = '';
  submittingPostEdit: boolean = false;
  submittingCommentEdit: boolean = false;

  clearComment(postId: number) {
    this.newCommentText[postId] = '';
  }

  submitComment(postId: number) {
    const content = this.newCommentText[postId] && this.newCommentText[postId].trim();
    if (!content) {
      return;
    }

    this.submittingComment[postId] = true;

    // Find the post for local update
    const post = this.postDTO.find(p => p.post.id === postId);
    if (!post) {
      this.submittingComment[postId] = false;
      return;
    }

    // Prepare comment data
    const commentData = {
      id: 0, // Backend will assign the actual ID
      postId: postId,
      content: content,
      userId: this.getCurrentUserId()
    };

    // Call the comment service to persist the comment
    this.commentService.createComment(commentData).subscribe({
      next: (newComment: Comment) => {
        // Update local state with the returned comment
        post.comments = post.comments || [];
        post.comments.push(newComment);

        // Clear input and reset submission state
        this.newCommentText[postId] = '';
        this.submittingComment[postId] = false;
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        this.submittingComment[postId] = false;
        // Optionally show error message to user
        alert('Failed to post comment. Please try again.');
      }
    });
  }

  // ==========================================
  // LIKE FUNCTIONALITY
  // ==========================================

  /**
   * Returns the current user ID for like operations.
   * TODO: Replace with actual authentication service integration.
   */
  private getCurrentUserId(): number {
    return 1; // This should come from your authentication service
  }
    private getCurrentUsername(): string {
    return "testuser"; // This should come from your authentication service
  }

  /**
   * Checks if the current user has liked a specific post.
   */
  isPostLikedByCurrentUser(post: PostDTO): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!post.likes) {
      return false;
    }
    return post.likes.some(like => {
      return like.user && like.user.id === currentUserId;
    });
  }

  /**
   * Toggles like status for a post (add/remove like).
   * TODO: Integrate with backend API for persistence.
   */
toggleLike(post: PostDTO): void {
  if (!post.post.id) {
    return;
  }

  const currentUserId = this.getCurrentUserId();
  const currentUsername = this.getCurrentUsername();
  const isCurrentlyLiked = this.isPostLikedByCurrentUser(post);

  if (isCurrentlyLiked) {
    // --- Find the like BEFORE removing it ---
    let likeToRemove: Like | undefined;
    if (post.likes) {
      likeToRemove = post.likes.find(like => like.user && like.user.id === currentUserId);
    }

    // --- Optimistically remove like locally ---
    if (post.likes) {
      post.likes = post.likes.filter(like => like.user && like.user.id !== currentUserId);
    }

    // --- Persist unlike to backend ---
    if (likeToRemove && likeToRemove.id) {
      this.likeService.deleteLike(likeToRemove.id).subscribe({
        next: () => {
          console.log(`toggleLike: Successfully removed like (id=${likeToRemove.id}) for post=${post.post.id}`);
        },
        error: (err) => {
          console.error(`toggleLike: Failed to remove like for post=${post.post.id}`, err);
          // Rollback optimistic change
          if (post.likes && likeToRemove) {
            post.likes.push(likeToRemove);
          }
        }
      });
    }

  } else {
    // --- Create like object locally for immediate feedback ---
    const tempLike: Like = {
      id: 0, // placeholder until backend assigns ID
      targetId: Number(post.post.id),
      targetType: 'post',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: currentUserId,
        username: currentUsername,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user'
      }
    };

    if (!post.likes) {
      post.likes = [];
    }
    post.likes.push(tempLike);

    // --- Persist like to backend ---
    this.likeService.createLike({
      targetId: post.post.id,
      targetType: 'post',
      userId: currentUserId
    }).subscribe({
      next: (createdLike) => {
        console.log('toggleLike: Successfully created like:', createdLike);

        // Normalize backend response into expected shape
        const normalizedLike: Like = {
          ...createdLike,
          user: {
            id: createdLike.user && createdLike.user.id
              ? createdLike.user.id
              : (createdLike.user.id || currentUserId),
            username: createdLike.user && createdLike.user.username
              ? createdLike.user.username
              : (createdLike.user.username || currentUsername),
            active: true,
            createdAt: createdLike.createdAt || new Date().toISOString(),
            updatedAt: createdLike.updatedAt || new Date().toISOString(),
            role: 'user'
          }
        };

        // Replace temp like with normalized persisted like
        if (post.likes) {
          const updatedLikes: Like[] = [];
          for (let like of post.likes) {
            if (like.id === 0 && like.user && like.user.id === currentUserId) {
              updatedLikes.push(normalizedLike);
            } else {
              updatedLikes.push(like);
            }
          }
          post.likes = updatedLikes;
        }
      },
      error: (err) => {
        console.error(`toggleLike: Failed to persist like for post=${post.post.id}`, err);
        // Rollback optimistic change
        if (post.likes) {
          post.likes = post.likes.filter(like => like.user && like.user.id !== currentUserId);
        }
      }
    });
  }
}



  // ==========================================
  // STATISTICS AND METRICS
  // ==========================================

  /**
   * Calculates total number of likes across all posts.
   */
  getTotalLikes(): number {
    if (!this.postDTO) return 0;
    return this.postDTO.reduce((total, dto) => {
      return total + (dto.likes && dto.likes.length ? dto.likes.length : 0);
    }, 0);
  }

  /**
   * Calculates total number of comments across all posts.
   */
  getTotalComments(): number {
    if (!this.postDTO) return 0;
    return this.postDTO.reduce((total, dto) => {
      return total + (dto.comments && dto.comments.length ? dto.comments.length : 0);
    }, 0);
  }

  /**
   * Counts unique active users across posts, comments, and likes.
   */
getActiveUsers(): number {
  if (!this.postDTO) return 0;
  const userIds = new Set<number>();

  this.postDTO.forEach(postDTO => {
    // Add post author safely
    if (postDTO && postDTO.post && postDTO.post.user && postDTO.post.user.id) {
      userIds.add(postDTO.post.user.id);
    }

    // Add comment authors safely
    if (postDTO && Array.isArray(postDTO.comments)) {
      postDTO.comments.forEach(comment => {
        if (comment && comment.user && comment.user.id) {
          userIds.add(comment.user.id);
        }
      });
    }

    // Add users who liked posts safely
    if (postDTO && Array.isArray(postDTO.likes)) {
      postDTO.likes.forEach(like => {
        if (like && like.user && like.user.id) {
          userIds.add(like.user.id);
        }
      });
    }
  });

  return userIds.size;
}

  // ==========================================
  // NEW POST PANEL MANAGEMENT
  // ==========================================

  // ==========================================
  // MOCK DATA FOR SIDE PANELS
  // ==========================================

  /**
   * Returns mock data for online users display.
   * TODO: Replace with real-time user service integration.
   */
  getOnlineUsers(): any[] {
    return [
      { id: 'user1', username: 'Alice Johnson', status: 'Writing a post...', lastActivity: '2m ago', avatar: '👩‍💼' },
      { id: 'user2', username: 'Bob Smith', status: 'Reading posts', lastActivity: '5m ago', avatar: '👨‍💻' },
      { id: 'user3', username: 'Carol Davis', status: 'Online', lastActivity: '1m ago', avatar: '👩‍🎨' },
      { id: 'user4', username: 'David Wilson', status: 'Typing...', lastActivity: 'now', avatar: '👨‍🔬' },
      { id: 'user5', username: 'Eva Martinez', status: 'Reading comments', lastActivity: '3m ago', avatar: '👩‍🚀' }
    ];
  }

  /**
   * Returns user avatar emoji with fallback.
   */
  getUserAvatar(user: any): string {
    return user.avatar || '👤';
  }

  /**
   * Returns user status with fallback.
   */
  getUserStatus(user: any): string {
    return user.status || 'Online';
  }

  /**
   * Returns user last activity time with fallback.
   */
  getUserLastActivity(user: any): string {
    return user.lastActivity || 'now';
  }

  /**
   * Returns mock recent activity data.
   * TODO: Replace with real activity tracking service.
   */
  getRecentActivity(): any[] {
    return [
      { icon: '❤️', username: 'Alice', action: 'liked a post', timeAgo: '1m' },
      { icon: '💬', username: 'Bob', action: 'commented', timeAgo: '2m' },
      { icon: '✍️', username: 'Carol', action: 'posted', timeAgo: '5m' },
      { icon: '👀', username: 'David', action: 'viewed profile', timeAgo: '8m' }
    ];
  }

  /**
   * Returns mock count of today's posts.
   * TODO: Implement actual date-based filtering.
   */
  getTodaysPosts(): number {
    return 12;
  }

  /**
   * Returns mock count of active discussions.
   * TODO: Implement actual comment thread analysis.
   */
  getActiveDiscussions(): number {
    return 7;
  }

}
