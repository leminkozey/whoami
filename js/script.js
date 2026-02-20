/* ============================================================
   whoami — Interactive Portfolio Script
   ============================================================ */

(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────
  const BOOT_LINE_INTERVAL_MS = 180;
  const BOOT_FADE_DELAY_MS = 600;
  const MATRIX_DURATION_MS = 5000;
  const MATRIX_FRAME_MS = 40;
  const LOGO_CLICK_THRESHOLD = 5;
  const LOGO_CLICK_RESET_MS = 2000;
  const RESIZE_DEBOUNCE_MS = 150;
  const SKILL_BAR_DELAY_MS = 200;
  const ATTRACT_RADIUS = 1.8;
  const ATTRACT_STRENGTH = 0.6;
  const SNAP_BACK_FACTOR = 0.1;

  const pageLoadTime = Date.now();

  // ─── Boot Sequence ───────────────────────────────────────────
  const bootLines = [
    { text: 'BIOS v3.7.1 — POST check', status: 'ok' },
    { text: 'Memory: 16384 MB OK', status: 'ok' },
    { text: 'Detecting hardware', status: 'ok' },
    { text: 'Loading kernel modules', status: 'ok' },
    { text: 'Mounting filesystems', status: 'done' },
    { text: 'Starting network services', status: 'ok' },
    { text: 'Fetching user profile', status: 'loaded' },
    { text: 'Decrypting portfolio data', status: 'done' },
    { text: 'Initializing 3D renderer', status: 'ok' },
    { text: 'Compiling stylesheets', status: 'done' },
    { text: 'Loading easter eggs', status: 'ok' },
    { text: 'System ready. Welcome.' },
  ];

  const bootScreen = document.getElementById('boot-screen');
  const bootLog = document.getElementById('boot-log');
  const mainSite = document.getElementById('main-site');

  document.body.style.overflow = 'hidden';

  function runBoot() {
    let i = 0;
    let skipped = false;
    const interval = setInterval(() => {
      if (skipped) return;
      if (i >= bootLines.length) {
        clearInterval(interval);
        skipped = true;
        document.removeEventListener('keydown', skipBoot);
        document.removeEventListener('click', skipBoot);
        setTimeout(finishBoot, BOOT_FADE_DELAY_MS);
        return;
      }
      const line = bootLines[i];
      const el = document.createElement('div');
      el.classList.add('boot-line');
      if (line.status) el.classList.add('status-' + line.status);
      el.textContent = '> ' + line.text;
      bootLog.appendChild(el);
      bootLog.scrollTop = bootLog.scrollHeight;
      i++;
    }, BOOT_LINE_INTERVAL_MS);

    function skipBoot() {
      if (skipped) return;
      skipped = true;
      clearInterval(interval);
      finishBoot();
      document.removeEventListener('keydown', skipBoot);
      document.removeEventListener('click', skipBoot);
    }
    document.addEventListener('keydown', skipBoot);
    document.addEventListener('click', skipBoot);
  }

  function finishBoot() {
    bootScreen.classList.add('fade-out');
    mainSite.classList.remove('hidden');
    document.body.style.overflow = '';

    const taglines = [
      'i build tools, break things & fix them \u2014 17y, germany',
      'building things that actually work \u2014 17y, germany',
      'turning ideas into deployments \u2014 17y, germany',
    ];
    const taglineEl = document.getElementById('hero-tagline');
    if (taglineEl) taglineEl.textContent = taglines[Math.floor(Math.random() * taglines.length)];

    setTimeout(() => {
      bootScreen.style.visibility = 'hidden';
      initRevealAnimations();
      initContributions();
      initVisitorCount();
    }, BOOT_FADE_DELAY_MS);
  }

  // Load Three.js immediately so the globe renders during boot
  const threeScript = document.createElement('script');
  threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  threeScript.onload = function () { initThreeJS(); };
  document.head.appendChild(threeScript);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBoot);
  } else {
    runBoot();
  }


  // ─── Three.js Hero — Wireframe Globe ─────────────────────────
  function initThreeJS() {
    const container = document.getElementById('three-container');
    if (!container || typeof THREE === 'undefined') return;
    if (container.querySelector('canvas')) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geo1 = new THREE.IcosahedronGeometry(1.4, 1);
    const mat1 = new THREE.MeshBasicMaterial({
      color: 0x00ffc8,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const mesh1 = new THREE.Mesh(geo1, mat1);
    scene.add(mesh1);

    const origPos1 = new Float32Array(geo1.attributes.position.array);

    const geo2 = new THREE.IcosahedronGeometry(0.9, 2);
    const mat2 = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const mesh2 = new THREE.Mesh(geo2, mat2);
    scene.add(mesh2);

    const origPos2 = new Float32Array(geo2.attributes.position.array);

    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00ffc8,
      size: 0.015,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    const mouse3D = new THREE.Vector3(0, 0, 0);
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(0, 0);

    document.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

      const rect = container.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    // Pre-allocated objects to avoid GC pressure in animation loop
    const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const _mouseWorld = new THREE.Vector3();
    const _localMouse = new THREE.Vector3();

    function deformMesh(mesh, origPositions) {
      raycaster.setFromCamera(mouseNDC, camera);
      const result = raycaster.ray.intersectPlane(_plane, _mouseWorld);
      if (!result) return;

      _localMouse.copy(_mouseWorld);
      mesh.worldToLocal(_localMouse);

      const posAttr = mesh.geometry.attributes.position;
      const arr = posAttr.array;

      for (let i = 0; i < posAttr.count; i++) {
        const ox = origPositions[i * 3];
        const oy = origPositions[i * 3 + 1];
        const oz = origPositions[i * 3 + 2];

        const dx = _localMouse.x - ox;
        const dy = _localMouse.y - oy;
        const dz = _localMouse.z - oz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < ATTRACT_RADIUS && dist > 0.01) {
          const force = (1 - dist / ATTRACT_RADIUS) * ATTRACT_STRENGTH;
          arr[i * 3] = ox + dx * force;
          arr[i * 3 + 1] = oy + dy * force;
          arr[i * 3 + 2] = oz + dz * force;
        } else {
          arr[i * 3] += (ox - arr[i * 3]) * SNAP_BACK_FACTOR;
          arr[i * 3 + 1] += (oy - arr[i * 3 + 1]) * SNAP_BACK_FACTOR;
          arr[i * 3 + 2] += (oz - arr[i * 3 + 2]) * SNAP_BACK_FACTOR;
        }
      }
      posAttr.needsUpdate = true;
    }

    let animating = true;
    let animFrameId = null;

    function animate() {
      if (!animating) { animFrameId = null; return; }
      animFrameId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      mesh1.rotation.y = time * 0.15;
      mesh1.rotation.x = time * 0.08;

      mesh2.rotation.y = -time * 0.1;
      mesh2.rotation.z = time * 0.05;

      particles.rotation.y = time * 0.02;

      deformMesh(mesh1, origPos1);
      deformMesh(mesh2, origPos2);

      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
    animate();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        animating = false;
        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
      } else {
        if (!animating) {
          animating = true;
          animate();
        }
      }
    });

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      }, RESIZE_DEBOUNCE_MS);
    });
  }


  // ─── Scroll Reveal Animations ────────────────────────────────
  function initRevealAnimations() {
    const sections = document.querySelectorAll('.reveal-section');
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            if (entry.target.id === 'skills') {
              animateSkillBars();
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }


  // ─── Skill Bar Animations ────────────────────────────────────
  function animateSkillBars() {
    const fills = document.querySelectorAll('.skill-fill');
    fills.forEach(function (fill) {
      const level = fill.getAttribute('data-level');
      setTimeout(function () {
        fill.style.width = level + '%';
      }, SKILL_BAR_DELAY_MS);
    });
  }


  // ─── Interactive Terminal ────────────────────────────────────
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  const commandHistory = [];
  let historyIndex = -1;

  const commands = {
    help: function () {
      return [
        'Available commands:',
        '',
        '  <span class="cmd-highlight">whoami</span>      — who am I?',
        '  <span class="cmd-highlight">about</span>       — learn more about me',
        '  <span class="cmd-highlight">skills</span>      — my technical skills',
        '  <span class="cmd-highlight">projects</span>    — things I\'ve built',
        '  <span class="cmd-highlight">contact</span>     — get in touch',
        '  <span class="cmd-highlight">socials</span>     — find me online',
        '  <span class="cmd-highlight">experience</span>  — work history',
        '  <span class="cmd-highlight">education</span>   — where I studied',
        '  <span class="cmd-highlight">clear</span>       — clear terminal',
        '  <span class="cmd-highlight">date</span>        — current date/time',
        '  <span class="cmd-highlight">history</span>     — command history',
        '  <span class="cmd-highlight">banner</span>      — show ASCII art',
        '  <span class="cmd-highlight">guestbook</span>   — sign or view the guestbook',
        '  <span class="cmd-highlight">help</span>        — show this message',
        '',
        '  ...try some creative commands too, like <span class="cmd-highlight">' +
        ['sudo rm -rf /', 'hack', 'matrix', 'ls', 'vim', 'exit', 'cat readme.md', 'sudo', 'winget moo'][Math.floor(Math.random() * 9)] +
        '</span> ...there is more ;)',
      ];
    },

    whoami: function () {
      return [
        '<span class="cmd-highlight">Leminkozey</span> (Manu)',
        'Azubi Fachinformatiker — Anwendungsentwicklung',
        'Germany',
        '',
        '"</imagining...>"',
      ];
    },

    about: function () {
      return [
        '┌──────────────────────────────────────────────────┐',
        '│  About Me                                        │',
        '├─────────────────────────────────────────────────┤',
        '│                                                  │',
        '│  17y old IT trainee from Germany. I build        │',
        '│  self-hosted tools, homelab dashboards, and      │',
        '│  web apps that solve real problems. Currently    │',
        '│  training as Fachinformatiker for application    │',
        '│  development. Powered by curiosity and Docker.   │',
        '│                                                  │',
        '└──────────────────────────────────────────────────┘',
      ];
    },

    skills: function () {
      return [
        '┌─ Languages ──────────────────────────────┐',
        '│  JavaScript  ████████████████████░░ 90%  │',
        '│  TypeScript  █████████████████░░░░░ 85%  │',
        '│  HTML / CSS  ████████████████████░░ 90%  │',
        '│  C# / .NET   ████████████░░░░░░░░░ 60%   │',
        '│  Java        ███████████░░░░░░░░░░ 55%   │',
        '├─ Frameworks ─────────────────────────────┤',
        '│  Node.js      ████████████████████░ 90%  │',
        '│  Next.js      █████████████████░░░░ 85%  │',
        '│  Tailwind CSS ████████████████░░░░░ 80%  │',
        '│  Prisma       ███████████████░░░░░░ 75%  │',
        '├─ Tools ──────────────────────────────────┤',
        '│  Docker       █████████████████░░░░ 85%  │',
        '│  Git          █████████████████░░░░ 85%  │',
        '│  Linux / RPi  ████████████████░░░░░ 80%  │',
        '│  SQLite       ███████████████░░░░░░ 75%  │',
        '└──────────────────────────────────────────┘',
      ];
    },

    projects: function () {
      return [
        'Featured Projects:',
        '',
        '  <span class="cmd-highlight">01.</span> Lemin-kanban',
        '      Kanban board with drag&drop, MCP server, SSE live updates',
        '      Stack: Next.js, TypeScript, SQLite, Prisma',
        '      → github.com/leminkozey/Lemin-kanban',
        '',
        '  <span class="cmd-highlight">02.</span> Netzwerk-Manager',
        '      Self-hosted network dashboard with WoL, SSH, Pi-hole, 2FA',
        '      Stack: Node.js, JavaScript, Raspberry Pi',
        '      → github.com/leminkozey/Netzwerk-Manager',
        '',
        '  <span class="cmd-highlight">03.</span> OfflineWiki',
        '      Local Wikipedia archive with Kiwix, offline search, Docker',
        '      Stack: HTML/CSS/JS, Docker, Node.js',
        '      → github.com/leminkozey/OfflineWiki',
        '',
        '  <span class="cmd-highlight">04.</span> whoami',
        '      This portfolio. Terminal-themed, zero frameworks.',
        '      Stack: HTML, CSS, JavaScript, Three.js',
        '      → github.com/leminkozey/whoami',
      ];
    },

    contact: function () {
      return [
        'Get in touch:',
        '',
        '  Email  : contact@leminkozey.me',
        '  GitHub : github.com/leminkozey',
        '  TikTok : tiktok.com/@leminkozey',
        '',
        'I\'m always open to interesting conversations.',
      ];
    },

    socials: function () {
      return commands.contact();
    },

    experience: function () {
      return [
        'Experience:',
        '',
        '  <span class="cmd-highlight">Present</span>  Ausbildung Fachinformatiker Anwendungsentwicklung',
        '    Learning the craft — building real software every day',
        '',
        '  <span class="cmd-highlight">Side</span>     Self-hosted homelab projects',
        '    Network dashboard, Kanban board, offline wiki, and more',
        '    Running on Raspberry Pi + Docker in my local network',
      ];
    },

    education: function () {
      return [
        'Education:',
        '',
        '  <span class="cmd-highlight">Current</span>  Ausbildung Fachinformatiker',
        '    Fachrichtung Anwendungsentwicklung',
        '',
        '  Self-taught through building projects, reading docs,',
        '  and breaking things until they work.',
      ];
    },

    clear: function () {
      terminalOutput.innerHTML = '';
      return [];
    },

    date: function () {
      return [new Date().toString()];
    },

    history: function () {
      if (commandHistory.length === 0) return ['No commands in history.'];
      return commandHistory.map(function (cmd, i) {
        return '  ' + (i + 1) + '  ' + escapeHTML(cmd);
      });
    },

    banner: function () {
      const pre = document.createElement('pre');
      pre.className = 'banner-art';
      const isWin = navigator.platform.indexOf('Win') > -1;
      if (isWin) {
        pre.textContent =
          '  ██╗      ███████╗ ███╗   ███╗ ██╗ ███╗   ██╗\n' +
          '  ██║      ██╔════╝ ████╗ ████║ ██║ ████╗  ██║\n' +
          '  ██║      █████╗   ██╔████╔██║ ██║ ██╔██╗ ██║\n' +
          '  ██║      ██╔══╝   ██║╚██╔╝██║ ██║ ██║╚██╗██║\n' +
          '  ███████╗ ███████╗ ██║ ╚═╝ ██║ ██║ ██║ ╚████║\n' +
          '  ╚══════╝ ╚══════╝ ╚═╝     ╚═╝ ╚═╝ ╚═╝  ╚═══╝';
      } else {
        pre.textContent =
          '  ██╗     ███████╗███╗   ███╗██╗███╗   ██╗\n' +
          '  ██║     ██╔════╝████╗ ████║██║████╗  ██║\n' +
          '  ██║     █████╗  ██╔████╔██║██║██╔██╗ ██║\n' +
          '  ██║     ██╔══╝  ██║╚██╔╝██║██║██║╚██╗██║\n' +
          '  ███████╗███████╗██║ ╚═╝ ██║██║██║ ╚████║\n' +
          '  ╚══════╝╚══════╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝';
      }
      terminalOutput.appendChild(pre);
      return [
        '',
        '  Leminkozey — i build tools, break things & fix them',
        '',
      ];
    },

    // ── Easter Egg Commands ──
    'sudo rm -rf /': function () {
      return [
        '<span class="cmd-error">rm: permission denied — nice try though 😏</span>',
        '<span class="cmd-error">This incident will be reported.</span>',
        '',
        '  ...just kidding. Or am I?',
      ];
    },

    sudo: function () {
      return [
        '<span class="cmd-error">[sudo] password for visitor: ********</span>',
        '<span class="cmd-error">visitor is not in the sudoers file.</span>',
        '<span class="cmd-error">This incident will be reported.</span>',
      ];
    },

    hack: function () {
      return [
        '<span class="cmd-error">ACCESS DENIED</span>',
        '',
        'Initializing countermeasures...',
        '████████████████████ 100%',
        '',
        'Nice try. My firewall runs on coffee.',
      ];
    },

    matrix: function () {
      triggerMatrixRain();
      return ['Entering the Matrix...'];
    },

    hello: function () {
      return ['Hello there! 👋 Type "help" to explore.'];
    },

    hi: function () {
      return commands.hello();
    },

    ls: function () {
      return [
        'about.txt    projects/    skills.json',
        'contact.md   readme.md    secrets/',
        '',
        'Try reading some of these with the right commands...',
      ];
    },

    pwd: function () {
      return ['/home/visitor/whoami-portfolio'];
    },

    cat: function () {
      return ['Usage: cat <filename>', 'Try: cat readme.md'];
    },

    'cat readme.md': function () {
      return [
        '# whoami',
        '',
        'A personal portfolio built with raw HTML, CSS, and JavaScript.',
        'No frameworks were harmed in the making of this site.',
        '',
        'Type "help" for available commands.',
      ];
    },

    exit: function () {
      return ['You can check out any time you like, but you can never leave. 🎸'];
    },

    'winget moo': function () {
      const cow = document.createElement('pre');
      cow.className = 'banner-art';
      cow.textContent =
        '         (__)\n' +
        '         (oo)\n' +
        '   /------\\/\n' +
        '  / |    ||\n' +
        ' *  /\\---/\\\n' +
        '    ~~   ~~';
      terminalOutput.appendChild(cow);
      return ['Have you mooed today?'];
    },

    moo: function () {
      return commands['winget moo']();
    },

    vim: function () {
      return [
        'Opening vim...',
        '',
        '  ...how do I exit this thing?',
        '',
        '  (hint: :q! ...or just close the browser tab)',
      ];
    },

    neofetch: function () {
      return [
        '       ╭──────────╮',
        '       │  ██████  │     <span class="cmd-highlight">leminkozey@portfolio</span>',
        '       │  ██  ██  │     ─────────────────────',
        '       │  ██████  │     OS: Web Browser',
        '       │  ██  ██  │     Host: The Internet',
        '       │  ██████  │     Kernel: HTML5',
        '       ╰──────────╯     Shell: JavaScript',
        '                         Theme: Terminal Dark',
        '                         Font: JetBrains Mono',
        '                         Uptime: since you loaded this page',
      ];
    },

    '42': function () {
      return ['The answer to life, the universe, and everything.'];
    },

    coffee: function () {
      return [
        '',
        '    ( (       ',
        '     ) )      ',
        '   ........   ',
        '   |      |]  ',
        '   \\      /  ',
        '    `----\'   ',
        '',
        'Here\'s your coffee. Now get back to coding.',
      ];
    },

    ping: function () {
      return [
        'PING leminkozey (127.0.0.1): 56 data bytes',
        '64 bytes: icmp_seq=0 ttl=64 time=0.042 ms',
        '64 bytes: icmp_seq=1 ttl=64 time=0.038 ms',
        '64 bytes: icmp_seq=2 ttl=64 time=0.041 ms',
        '',
        '--- leminkozey ping statistics ---',
        '3 packets transmitted, 3 received, 0% packet loss',
        'round-trip min/avg/max = 0.038/0.040/0.042 ms',
        '',
        'Yep, I\'m alive!',
      ];
    },

    uptime: function () {
      const ms = Date.now() - pageLoadTime;
      let secs = Math.floor(ms / 1000);
      let mins = Math.floor(secs / 60);
      let hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      secs %= 60;
      mins %= 60;
      hrs %= 24;
      const parts = [];
      if (days > 0) parts.push(days + (days === 1 ? ' day' : ' days'));
      if (hrs > 0) parts.push(hrs + (hrs === 1 ? ' hour' : ' hours'));
      if (mins > 0) parts.push(mins + (mins === 1 ? ' min' : ' mins'));
      parts.push(secs + (secs === 1 ? ' sec' : ' secs'));
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      return [
        ' ' + timeStr + ' up ' + parts.join(', ') + ', 1 user, load average: 0.42, 0.17, 0.08',
      ];
    },

    guestbook: function () { return []; },

    'cat resume': function () {
      return [
        '',
        '  ====================================',
        '   LEMIN KOZEY — Resume',
        '  ====================================',
        '',
        '  <span class="cmd-highlight">Role:</span>       Azubi Fachinformatiker',
        '              Anwendungsentwicklung',
        '  <span class="cmd-highlight">Location:</span>   Germany',
        '  <span class="cmd-highlight">Website:</span>    leminkozey.me',
        '',
        '  --- Skills ---',
        '  Languages:  JavaScript, TypeScript, HTML/CSS, C#, Java',
        '  Frameworks: Node.js, Next.js, Tailwind CSS, Prisma',
        '  Tools:      Docker, Git, Linux, SQLite, Raspberry Pi',
        '',
        '  --- Projects ---',
        '  Lemin-kanban    Kanban board with MCP server + SSE',
        '  Netzwerk-Mgr    Self-hosted network dashboard + 2FA',
        '  OfflineWiki     Local Wikipedia archive with Kiwix',
        '  whoami           This terminal portfolio',
        '',
        '  --- Education ---',
        '  Ausbildung Fachinformatiker Anwendungsentwicklung',
        '  + self-taught through building, breaking, and fixing',
        '',
        '  --- Contact ---',
        '  Email:   contact@leminkozey.me',
        '  GitHub:  github.com/leminkozey',
        '',
      ];
    },
  };


  // ─── Typing Sound (Web Audio API) ─────────────────────────
  let audioCtx = null;
  let soundMuted = false;
  const soundToggle = document.getElementById('sound-toggle');

  if (soundToggle) {
    soundToggle.addEventListener('click', function () {
      soundMuted = !soundMuted;
      soundToggle.classList.toggle('muted', soundMuted);
    });
  }

  function playKeySound() {
    if (soundMuted) return;
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return; }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const t = audioCtx.currentTime;
    const duration = 0.012 + Math.random() * 0.008;

    const bufferSize = Math.ceil(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800 + Math.random() * 600;
    filter.Q.value = 2;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(t);
    noise.stop(t + duration);
  }


  // ─── Ghost Autocomplete ─────────────────────────────────────
  const ghostEl = document.getElementById('terminal-ghost');
  let currentSuggestion = '';

  function updateGhost() {
    const input = terminalInput.value.toLowerCase();
    currentSuggestion = '';
    if (ghostEl) ghostEl.textContent = '';
    if (input.length < 2) return;
    const allCmds = Object.keys(commands);
    for (let i = 0; i < allCmds.length; i++) {
      if (allCmds[i].indexOf(input) === 0 && allCmds[i] !== input) {
        currentSuggestion = allCmds[i];
        if (ghostEl) ghostEl.textContent = currentSuggestion;
        return;
      }
    }
  }

  function clearGhost() {
    currentSuggestion = '';
    if (ghostEl) ghostEl.textContent = '';
  }


  // ─── Terminal Input Handling ─────────────────────────────────
  if (terminalInput) {
    terminalInput.addEventListener('input', updateGhost);

    terminalInput.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Tab') playKeySound();

      if (e.key === 'Tab') {
        e.preventDefault();
        if (currentSuggestion) {
          terminalInput.value = currentSuggestion;
          clearGhost();
        }
        return;
      }

      if (e.key === 'Enter') {
        clearGhost();

        const cmd = terminalInput.value.trim();
        if (!cmd) return;

        commandHistory.push(cmd);
        historyIndex = commandHistory.length;

        appendToTerminal(
          '<span class="cmd-prefix">visitor@whoami:~$</span> <span class="cmd-input">' +
            escapeHTML(cmd) +
            '</span>'
        );

        const cmdLower = cmd.toLowerCase();
        if (cmdLower === 'guestbook' || cmdLower.startsWith('guestbook ')) {
          handleGuestbook(cmd);
        } else {
          const handler = commands[cmdLower];
          if (handler) {
            const output = handler();
            output.forEach(function (line) {
              appendToTerminal('<span class="cmd-result">' + line + '</span>');
            });
          } else {
            appendToTerminal(
              '<span class="cmd-error">command not found: ' +
                escapeHTML(cmd) +
                '. Type "help" for available commands.</span>'
            );
          }
        }

        appendToTerminal('&nbsp;');
        terminalInput.value = '';
        clearGhost();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          terminalInput.value = commandHistory[historyIndex];
        }
        clearGhost();
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          terminalInput.value = commandHistory[historyIndex];
        } else {
          historyIndex = commandHistory.length;
          terminalInput.value = '';
        }
        clearGhost();
      }
    });

    const termWindow = document.querySelector('.terminal-window');
    if (termWindow) {
      termWindow.addEventListener('click', function () {
        terminalInput.focus();
      });
    }
  }

  function appendToTerminal(html) {
    const p = document.createElement('p');
    p.innerHTML = html;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  // ─── Guestbook Command ────────────────────────────────────────
  function handleGuestbook(cmd) {
    const args = cmd.substring('guestbook'.length).trim();

    if (!args) {
      fetch('/api/guestbook')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            appendToTerminal('<span class="cmd-error">' + escapeHTML(data.error) + '</span>');
            return;
          }
          if (!data.entries || data.entries.length === 0) {
            appendToTerminal('<span class="cmd-result">It looks pretty empty here.. Fill it with your creativity!</span>');
          } else {
            appendToTerminal('<span class="cmd-highlight">Guestbook (' + data.entries.length + (data.entries.length === 1 ? ' entry' : ' entries') + '):</span>');
            appendToTerminal('&nbsp;');
            data.entries.forEach(function (entry) {
              appendToTerminal(
                '<span class="cmd-result">  [' + escapeHTML(entry.date) + ']  ' +
                '<span class="cmd-highlight">' + escapeHTML(entry.name) + '</span>: ' +
                escapeHTML(entry.message) + '</span>'
              );
            });
          }
          appendToTerminal('&nbsp;');
          appendGuestbookUsage();
        })
        .catch(function () {
          appendToTerminal('<span class="cmd-result">It looks pretty empty here.. Fill it with your creativity!</span>');
          appendToTerminal('&nbsp;');
          appendGuestbookUsage();
        });
      return;
    }

    let name = '';
    let message = args;
    const nameMatch = args.match(/^--name\s+(\S+)\s+([\s\S]+)$/);
    if (nameMatch) {
      name = nameMatch[1];
      message = nameMatch[2];
    }

    if (message.length > 100) {
      appendToTerminal('<span class="cmd-error">Message too long (max 100 chars)</span>');
      return;
    }

    const body = { message: message };
    if (name) body.name = name;

    fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          appendToTerminal('<span class="cmd-error">' + escapeHTML(data.error) + '</span>');
          return;
        }
        appendToTerminal('<span class="cmd-highlight">Guestbook signed!</span>');
        appendToTerminal(
          '<span class="cmd-result">  [' + escapeHTML(data.entry.date) + ']  ' +
          '<span class="cmd-highlight">' + escapeHTML(data.entry.name) + '</span>: ' +
          escapeHTML(data.entry.message) + '</span>'
        );
      })
      .catch(function () {
        appendToTerminal('<span class="cmd-error">Failed to sign guestbook.</span>');
      });
  }

  function appendGuestbookUsage() {
    appendToTerminal('<span class="cmd-result">Sign the guestbook:</span>');
    appendToTerminal('<span class="cmd-result">  <span class="cmd-highlight">guestbook &lt;message&gt;</span>              — sign as Anonymous</span>');
    appendToTerminal('<span class="cmd-result">  <span class="cmd-highlight">guestbook --name Name &lt;message&gt;</span>  — sign with your name</span>');
    appendToTerminal('&nbsp;');
    appendToTerminal('<span class="cmd-result">  Example: <span class="cmd-highlight">guestbook --name Max Cool site!</span></span>');
  }


  // ─── Easter Egg: Konami Code ─────────────────────────────────
  const konamiSequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
  ];
  let konamiIndex = 0;

  document.addEventListener('keydown', function (e) {
    if (e.target === terminalInput) return;

    if (e.key === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        konamiIndex = 0;
        triggerKonamiEasterEgg();
      }
    } else {
      konamiIndex = 0;
    }
  });

  function triggerKonamiEasterEgg() {
    triggerMatrixRain();
    if (terminalOutput) {
      appendToTerminal('&nbsp;');
      appendToTerminal(
        '<span class="cmd-highlight">🎮 KONAMI CODE ACTIVATED!</span>'
      );
      appendToTerminal(
        '<span class="cmd-result">You found a secret! You\'re clearly a person of culture.</span>'
      );
      appendToTerminal(
        '<span class="cmd-result">+30 lives added. Not that you needed them.</span>'
      );
      appendToTerminal('&nbsp;');
    }
  }


  // ─── Easter Egg: Matrix Rain ─────────────────────────────────
  let matrixRunning = false;

  function triggerMatrixRain() {
    if (matrixRunning) return;
    matrixRunning = true;
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) { matrixRunning = false; return; }

    canvas.classList.add('active');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -50);
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';

    const matrixInterval = setInterval(function () {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ffc8';
      ctx.font = fontSize + 'px monospace';

      for (let col = 0; col < drops.length; col++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, col * fontSize, drops[col] * fontSize);

        if (drops[col] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[col] = 0;
        }
        drops[col]++;
      }
    }, MATRIX_FRAME_MS);

    setTimeout(function () {
      clearInterval(matrixInterval);
      canvas.classList.remove('active');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      matrixRunning = false;
    }, MATRIX_DURATION_MS);
  }


  // ─── Easter Egg: Logo Click (5x) ────────────────────────────
  let logoClickCount = 0;
  let logoClickTimer = null;
  const logo = document.getElementById('logo');

  if (logo) {
    logo.addEventListener('click', function () {
      logoClickCount++;
      clearTimeout(logoClickTimer);

      logoClickTimer = setTimeout(function () {
        logoClickCount = 0;
      }, LOGO_CLICK_RESET_MS);

      if (logoClickCount >= LOGO_CLICK_THRESHOLD) {
        logoClickCount = 0;
        triggerLogoEasterEgg();
      }
    });
  }

  function triggerLogoEasterEgg() {
    logo.classList.add('logo-spin');
    setTimeout(function () {
      logo.classList.remove('logo-spin');
    }, 1000);

    document.body.classList.add('invert-flash');
    setTimeout(function () {
      document.body.classList.remove('invert-flash');
    }, 2000);

    mainSite.classList.add('page-shake');
    setTimeout(function () {
      mainSite.classList.remove('page-shake');
    }, 600);

    document.documentElement.style.setProperty('--accent', '#ff005f');
    setTimeout(function () {
      document.documentElement.style.setProperty('--accent', '#00ffc8');
    }, 3000);

    if (terminalOutput) {
      appendToTerminal('&nbsp;');
      appendToTerminal(
        '<span class="cmd-highlight">🔮 SYSTEM GLITCH DETECTED</span>'
      );
      appendToTerminal(
        '<span class="cmd-result">Reality.exe has encountered an unexpected error.</span>'
      );
      appendToTerminal(
        '<span class="cmd-result">Restoring universe from backup... done.</span>'
      );
      appendToTerminal('&nbsp;');
    }
  }


  // ─── GitHub Contributions ────────────────────────────────────
  function initContributions() {
    const graph = document.getElementById('contribution-graph');
    const total = document.getElementById('github-total');
    if (!graph) return;

    fetch('https://github-contributions-api.jogruber.de/v4/leminkozey?y=last')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        const contributions = data.contributions;
        if (!contributions || !contributions.length) throw new Error('no data');

        let totalCount = 0;
        Object.values(data.total).forEach(function (v) { totalCount += v; });
        if (total) {
          total.textContent = '';
          const countSpan = document.createElement('span');
          countSpan.textContent = totalCount;
          total.appendChild(countSpan);
          total.appendChild(document.createTextNode(' contributions in the last year'));
        }

        const firstDay = new Date(contributions[0].date).getDay();
        const weeks = [];
        let week = [];

        for (let p = 0; p < firstDay; p++) {
          week.push(null);
        }

        contributions.forEach(function (day) {
          week.push(day);
          if (week.length === 7) {
            weeks.push(week);
            week = [];
          }
        });
        if (week.length) weeks.push(week);

        const tooltip = document.createElement('div');
        tooltip.className = 'contrib-tooltip';
        document.body.appendChild(tooltip);

        window.addEventListener('scroll', function () {
          tooltip.classList.remove('visible');
        }, { passive: true });

        weeks.forEach(function (w) {
          const col = document.createElement('div');
          col.className = 'contrib-week';
          w.forEach(function (day) {
            const cell = document.createElement('div');
            cell.className = 'contrib-day';
            if (day) {
              cell.setAttribute('data-level', day.level);
              cell.setAttribute('data-count', day.count);
              cell.setAttribute('data-date', day.date);
              cell.addEventListener('mouseenter', function () {
                tooltip.textContent = day.count + ' contributions on ' + day.date;
                tooltip.classList.add('visible');
                const rect = cell.getBoundingClientRect();
                tooltip.style.top = (rect.top - 8) + 'px';
                const tooltipWidth = tooltip.offsetWidth;
                const maxLeft = window.innerWidth - tooltipWidth - 8;
                const currentLeft = rect.left + rect.width / 2;
                tooltip.style.left = Math.min(currentLeft, maxLeft) + 'px';
              });
              cell.addEventListener('mouseleave', function () {
                tooltip.classList.remove('visible');
              });
            } else {
              cell.setAttribute('data-level', '0');
            }
            col.appendChild(cell);
          });
          graph.appendChild(col);
        });

        graph.scrollLeft = graph.scrollWidth;
      })
      .catch(function (err) {
        if (total) total.textContent = 'could not load contributions.';
        console.error('Contributions fetch failed:', err);
      });
  }


  // ─── Visitor Counter ─────────────────────────────────────────
  function initVisitorCount() {
    fetch('/api/visitors')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        const el = document.getElementById('visitor-num');
        if (el && typeof data.count === 'number') el.textContent = data.count;
      })
      .catch(function () {});
  }


  // ─── Hamburger Menu ──────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('main-nav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mainNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', hamburger.classList.contains('open'));
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mainNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mainNav.contains(e.target)) {
        hamburger.classList.remove('open');
        mainNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }


  // ─── Smooth Scroll for Nav Links ────────────────────────────
  document.querySelectorAll('#main-nav a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
