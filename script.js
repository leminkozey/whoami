/* ============================================================
   whoami — Interactive Portfolio Script
   ============================================================ */

(function () {
  'use strict';

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

  function runBoot() {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= bootLines.length) {
        clearInterval(interval);
        setTimeout(finishBoot, 600);
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
    }, 180);
  }

  function finishBoot() {
    bootScreen.classList.add('fade-out');
    mainSite.classList.remove('hidden');
    setTimeout(() => {
      bootScreen.style.display = 'none';
      initThreeJS();
      initRevealAnimations();
      animateSkillBars();
      initContributions();
    }, 600);
  }

  // Start boot on load
  window.addEventListener('DOMContentLoaded', runBoot);


  // ─── Three.js Hero — Wireframe Globe ─────────────────────────
  function initThreeJS() {
    const container = document.getElementById('three-container');
    if (!container || typeof THREE === 'undefined') return;

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

    // Wireframe icosahedron
    const geo1 = new THREE.IcosahedronGeometry(1.4, 1);
    const mat1 = new THREE.MeshBasicMaterial({
      color: 0x00ffc8,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const mesh1 = new THREE.Mesh(geo1, mat1);
    scene.add(mesh1);

    // Inner sphere
    const geo2 = new THREE.IcosahedronGeometry(0.9, 2);
    const mat2 = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const mesh2 = new THREE.Mesh(geo2, mat2);
    scene.add(mesh2);

    // Particles
    const particleCount = 200;
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

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      mesh1.rotation.y = time * 0.15;
      mesh1.rotation.x = time * 0.08;

      mesh2.rotation.y = -time * 0.1;
      mesh2.rotation.z = time * 0.05;

      particles.rotation.y = time * 0.02;

      // Subtle parallax
      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', function () {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
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
            // Animate skill bars when skills section is revealed
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
      }, 200);
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
        '  <span class="cmd-highlight">help</span>        — show this message',
        '',
        '  ...try some creative commands too ;)',
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
        '┌──────────────────────────────────────────────┐',
        '│  About Me                                     │',
        '├──────────────────────────────────────────────┤',
        '│                                               │',
        '│  17y old IT trainee from Germany. I build      │',
        '│  self-hosted tools, homelab dashboards, and    │',
        '│  web apps that solve real problems. Currently  │',
        '│  training as Fachinformatiker for application  │',
        '│  development. Powered by curiosity and Docker. │',
        '│                                               │',
        '└──────────────────────────────────────────────┘',
      ];
    },

    skills: function () {
      return [
        '┌─ Languages ─────────────────────────────┐',
        '│  JavaScript  ████████████████████░░ 90%  │',
        '│  TypeScript  █████████████████░░░░░ 85%  │',
        '│  HTML / CSS  ████████████████████░░ 90%  │',
        '│  C# / .NET   ████████████░░░░░░░░░ 60%  │',
        '│  Java        ███████████░░░░░░░░░░ 55%  │',
        '├─ Frameworks ────────────────────────────┤',
        '│  Node.js      ████████████████████░ 90%  │',
        '│  Next.js      █████████████████░░░░ 85%  │',
        '│  Tailwind CSS ████████████████░░░░░ 80%  │',
        '│  Prisma       ███████████████░░░░░░ 75%  │',
        '├─ Tools ─────────────────────────────────┤',
        '│  Docker       █████████████████░░░░ 85%  │',
        '│  Git          █████████████████░░░░ 85%  │',
        '│  Linux / RPi  ████████████████░░░░░ 80%  │',
        '│  SQLite       ███████████████░░░░░░ 75%  │',
        '└─────────────────────────────────────────┘',
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
        return '  ' + (i + 1) + '  ' + cmd;
      });
    },

    banner: function () {
      return [
        '',
        '  ██╗    ██╗██╗  ██╗ ██████╗  █████╗ ███╗   ███╗██╗',
        '  ██║    ██║██║  ██║██╔═══██╗██╔══██╗████╗ ████║██║',
        '  ██║ █╗ ██║███████║██║   ██║███████║██╔████╔██║██║',
        '  ██║███╗██║██╔══██║██║   ██║██╔══██║██║╚██╔╝██║██║',
        '  ╚███╔███╔╝██║  ██║╚██████╔╝██║  ██║██║ ╚═╝ ██║██║',
        '   ╚══╝╚══╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝',
        '',
        '  Leminkozey — </imagining...>',
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
        '       │  ██████   │     <span class="cmd-highlight">leminkozey@portfolio</span>',
        '       │  ██  ██   │     ─────────────────────',
        '       │  ██████   │     OS: Web Browser',
        '       │  ██  ██   │     Host: The Internet',
        '       │  ██████   │     Kernel: HTML5',
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
        '    ( (',
        '     ) )',
        '   ........',
        '   |      |]',
        '   \\      /',
        '    `----\'',
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
  };

  // Process terminal input
  if (terminalInput) {
    terminalInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim();
        if (!cmd) return;

        commandHistory.push(cmd);
        historyIndex = commandHistory.length;

        // Show input
        appendToTerminal(
          '<span class="cmd-prefix">visitor@whoami:~$</span> <span class="cmd-input">' +
            escapeHTML(cmd) +
            '</span>'
        );

        // Process command
        const handler = commands[cmd.toLowerCase()];
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

        appendToTerminal('&nbsp;');
        terminalInput.value = '';
      }

      // Command history navigation
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          terminalInput.value = commandHistory[historyIndex];
        }
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
      }
    });

    // Focus terminal input when clicking on terminal window
    var termWindow = document.querySelector('.terminal-window');
    if (termWindow) {
      termWindow.addEventListener('click', function () {
        terminalInput.focus();
      });
    }
  }

  function appendToTerminal(html) {
    var p = document.createElement('p');
    p.innerHTML = html;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  // ─── Easter Egg: Konami Code ─────────────────────────────────
  var konamiSequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
  ];
  var konamiIndex = 0;

  document.addEventListener('keydown', function (e) {
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
    // Also add a fun message to terminal
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
  function triggerMatrixRain() {
    var canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;

    canvas.classList.add('active');
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var fontSize = 14;
    var columns = Math.floor(canvas.width / fontSize);
    var drops = [];
    for (var i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -50);
    }

    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';

    var matrixInterval = setInterval(function () {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ffc8';
      ctx.font = fontSize + 'px monospace';

      for (var col = 0; col < drops.length; col++) {
        var text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, col * fontSize, drops[col] * fontSize);

        if (drops[col] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[col] = 0;
        }
        drops[col]++;
      }
    }, 40);

    // Stop after 5 seconds
    setTimeout(function () {
      clearInterval(matrixInterval);
      canvas.classList.remove('active');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 5000);
  }


  // ─── Easter Egg: Logo Click (5x) ────────────────────────────
  var logoClickCount = 0;
  var logoClickTimer = null;
  var logo = document.getElementById('logo');

  if (logo) {
    logo.addEventListener('click', function () {
      logoClickCount++;
      clearTimeout(logoClickTimer);

      logoClickTimer = setTimeout(function () {
        logoClickCount = 0;
      }, 2000);

      if (logoClickCount >= 5) {
        logoClickCount = 0;
        triggerLogoEasterEgg();
      }
    });
  }

  function triggerLogoEasterEgg() {
    // Spin the logo
    logo.classList.add('logo-spin');
    setTimeout(function () {
      logo.classList.remove('logo-spin');
    }, 1000);

    // Invert the page briefly
    document.body.classList.add('invert-flash');
    setTimeout(function () {
      document.body.classList.remove('invert-flash');
    }, 2000);

    // Shake it
    mainSite.classList.add('page-shake');
    setTimeout(function () {
      mainSite.classList.remove('page-shake');
    }, 600);

    // Temporarily change all accent colors
    document.documentElement.style.setProperty('--accent', '#ff005f');
    setTimeout(function () {
      document.documentElement.style.setProperty('--accent', '#00ffc8');
    }, 3000);

    // Terminal message
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
    var graph = document.getElementById('contribution-graph');
    var total = document.getElementById('github-total');
    if (!graph) return;

    fetch('https://github-contributions-api.jogruber.de/v4/leminkozey?y=last')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var contributions = data.contributions;
        var totalCount = Object.values(data.total).reduce(function (a, b) { return a + b; }, 0);

        total.innerHTML = '<span>' + totalCount + '</span> contributions in the last year';

        // Group by week
        var weeks = [];
        var week = [];
        contributions.forEach(function (day, i) {
          week.push(day);
          if (week.length === 7) {
            weeks.push(week);
            week = [];
          }
        });
        if (week.length) weeks.push(week);

        weeks.forEach(function (w) {
          var col = document.createElement('div');
          col.className = 'contrib-week';
          w.forEach(function (day) {
            var cell = document.createElement('div');
            cell.className = 'contrib-day';
            cell.setAttribute('data-level', day.level);
            cell.setAttribute('data-tooltip', day.count + ' contributions on ' + day.date);
            col.appendChild(cell);
          });
          graph.appendChild(col);
        });
      })
      .catch(function () {
        total.textContent = 'could not load contributions.';
      });
  }

  // ─── Hamburger Menu ──────────────────────────────────────────
  var hamburger = document.getElementById('hamburger');
  var mainNav = document.getElementById('main-nav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mainNav.classList.toggle('open');
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mainNav.classList.remove('open');
      });
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mainNav.contains(e.target)) {
        hamburger.classList.remove('open');
        mainNav.classList.remove('open');
      }
    });
  }

  // ─── Smooth scroll for nav links ────────────────────────────
  document.querySelectorAll('nav a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
