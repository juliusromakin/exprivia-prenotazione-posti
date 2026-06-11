import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, HostListener } from '@angular/core';

@Component({
  selector: 'app-animated-background',
  standalone: true,
  template: `
    <canvas #bgCanvas class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
    <!-- CSS to apply a dark technological gradient -->
    <style>
      :host {
        display: block;
        position: fixed;
        inset: 0;
        z-index: -10;
        background: radial-gradient(circle at center, #0d2136 0%, #06101c 100%);
      }
    </style>
  `
})
export class AnimatedBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId: number = 0;
  private resizeObserver!: ResizeObserver;
  private width: number = 0;
  private height: number = 0;
  private mouseX: number = -1000;
  private mouseY: number = -1000;

  constructor(private ngZone: NgZone) {}

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  @HostListener('window:mouseout')
  onMouseOut() {
    this.mouseX = -1000;
    this.mouseY = -1000;
  }

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    this.resizeObserver.observe(canvas);

    this.resizeCanvas();
    this.initParticles();

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;
    
    if (this.particles.length === 0) {
      this.initParticles();
    }
  }

  private initParticles() {
    this.particles = [];
    const numberOfParticles = Math.floor((this.width * this.height) / 10000); // Increased density for tech feel
    
    for (let i = 0; i < numberOfParticles; i++) {
      this.particles.push(new Particle(this.width, this.height));
    }
  }

  private animate = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      // Connect particle to mouse
      const dxMouse = this.particles[i].x - this.mouseX;
      const dyMouse = this.particles[i].y - this.mouseY;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
      
      if (distMouse < 150) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(0, 212, 255, ${1 - distMouse / 150})`; // Glowing cyan to mouse
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
        this.ctx.lineTo(this.mouseX, this.mouseY);
        this.ctx.stroke();
      }

      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          this.ctx.beginPath();
          // Mix of colors based on distance
          const opacity = 1 - distance / 120;
          this.ctx.strokeStyle = `rgba(100, 180, 255, ${opacity * 0.5})`; // Tech blue lines
          this.ctx.lineWidth = 0.8;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Update and draw particles
    this.particles.forEach(p => {
      p.update(this.width, this.height, this.mouseX, this.mouseY);
      p.draw(this.ctx);
    });

    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}

class Particle {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  baseSize: number;
  color: string;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.speedX = (Math.random() - 0.5) * 1.0;
    this.speedY = (Math.random() - 0.5) * 1.0;
    this.baseSize = Math.random() * 2 + 0.5;
    
    // 20% orange particles, 80% cyan/blue particles for cyber look
    const rand = Math.random();
    if (rand < 0.2) {
      this.color = 'rgba(240, 114, 52, 0.8)'; // Exprivia Orange
    } else if (rand < 0.6) {
      this.color = 'rgba(0, 212, 255, 0.8)'; // Cyan
    } else {
      this.color = 'rgba(100, 180, 255, 0.8)'; // Light blue
    }
  }

  update(width: number, height: number, mouseX: number, mouseY: number) {
    // Mouse repulsion
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 100) {
      const force = (100 - dist) / 100;
      this.x += (dx / dist) * force * 2;
      this.y += (dy / dist) * force * 2;
    }

    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap around screen instead of bounce for a more infinite network feel
    if (this.x > width) this.x = 0;
    if (this.x < 0) this.x = width;
    if (this.y > height) this.y = 0;
    if (this.y < 0) this.y = height;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.baseSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }
}
