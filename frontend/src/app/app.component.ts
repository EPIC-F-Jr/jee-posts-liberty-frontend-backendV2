import { Component, ElementRef, HostListener, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { PostService } from './services/post.service';
import { Post } from './models/post';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './side-panels.component.css', './newpost.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'Posts Frontend';

  @ViewChild('appHeader') appHeader!: ElementRef;
  @ViewChild('newPostPanel') newPostPanel!: ElementRef;

  showHamburgerMenu = false;
  menuOpen = false;
  private scrollThreshold = 100; // Show hamburger when scrolled past this point

  // New post functionality
  showNewPostPanel = false;
  newPostContent = '';
  authorName = '';
  submittingPost = false;

  constructor(private postService: PostService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.checkScrollPosition();
  }

  ngOnDestroy() {
    // Clean up any subscriptions if needed
  }

  updateContent(event: Event) {
    this.newPostContent = (event.target as HTMLTextAreaElement).value;
  }

  updateAuthor(event: Event) {
    this.authorName = (event.target as HTMLInputElement).value;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.checkScrollPosition();
  }

  private checkScrollPosition() {
    if (this.appHeader) {
      const headerRect = this.appHeader.nativeElement.getBoundingClientRect();
      const headerBottom = headerRect.bottom;

      // Show hamburger menu when header is out of view (with some threshold)
      this.showHamburgerMenu = headerBottom < 0;
    }
  }

  toggleMobileMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMobileMenu() {
    this.menuOpen = false;
  }

  // New post functionality
  openNewPostPanel() {
    console.log('openNewPostPanel called - before:', this.showNewPostPanel);
    this.showNewPostPanel = true;
    this.cdr.detectChanges(); // Force change detection
    console.log('openNewPostPanel called - after:', this.showNewPostPanel);
  }

  closeNewPostPanel() {
    console.log('closeNewPostPanel called - before:', this.showNewPostPanel);
    if (this.newPostPanel) {
      console.log('Panel element classes before:', this.newPostPanel.nativeElement.className);
      console.log('Panel element computed style before:', window.getComputedStyle(this.newPostPanel.nativeElement).visibility);
    }

    this.showNewPostPanel = false;
    this.newPostContent = '';
    this.authorName = '';
    this.cdr.detectChanges(); // Force change detection

    console.log('closeNewPostPanel called - after:', this.showNewPostPanel);
    if (this.newPostPanel) {
      console.log('Panel element classes after:', this.newPostPanel.nativeElement.className);
      setTimeout(() => {
        console.log('Panel element computed style after (delayed):', window.getComputedStyle(this.newPostPanel.nativeElement).visibility);
      }, 500);
    }
  }

  closeFromOverlay() {
    console.log('Overlay clicked - closing panel');
    this.closeNewPostPanel();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  submitNewPost() {
    console.log('submitNewPost called - showNewPostPanel:', this.showNewPostPanel);

    if (!this.canSubmitPost()) {
      return;
    }

    this.submittingPost = true;

    const newPost = {
      userId: this.authorName,
      content: this.newPostContent
    };

    this.postService.createPost(newPost).subscribe(
      response => {
        console.log('Post created successfully, calling closeNewPostPanel');
        this.submittingPost = false;
        // this.showNewPostPanel = false;
        // Add a slight delay to ensure the success state is processed
        setTimeout(() => {
          this.closeNewPostPanel();
        }, 100);

        console.log('New post created successfully', response);
        // Could emit an event here to refresh posts in the posts component
      },
      error => {
        this.submittingPost = false;
        console.error('Error creating post', error);
      }
    );
  }

  canSubmitPost(): boolean {
    return this.newPostContent.trim().length >= 10 &&
           this.authorName.trim().length >= 2 &&
           !this.submittingPost;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.closeMobileMenu();
  }

  scrollToPosts() {
    const postsElement = document.querySelector('app-posts');
    if (postsElement) {
      postsElement.scrollIntoView({ behavior: 'smooth' });
    }
    this.closeMobileMenu();
  }
}
