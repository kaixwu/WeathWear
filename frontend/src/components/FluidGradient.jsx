import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fluidShader = `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec4 iMouse;
    uniform int iFrame;
    uniform sampler2D iPreviousFrame;
    uniform float uBrushSize;
    uniform float uBrushStrength;
    uniform float uFluidDecay;
    uniform float uTrailLength;
    uniform float uStopDecay;
    varying vec2 vUv;
    vec2 ur, u;
    
    float ln(in vec2 p, vec2 a, vec2 b) {
        return length(p-a-(b-a)*clamp(dot(p-a,b-a)/dot(b-a,b-a),0.,1.));
    }
    
    vec4 t(vec2 v, int a, int b) {
        return texture2D(iPreviousFrame, fract((v+vec2(float(a),float(b)))/ur));
    }
    
    vec4 t(vec2 v) {
        return texture2D(iPreviousFrame, fract(v/ur));
    }
    
    float area(vec2 a, vec2 b, vec2 c) {
        float A = length(b-c), B = length(c-a), C = length(a-b), S = (A+B+C)*0.5;
        return sqrt(S*(S-A)*(S-B)*(S-C));
    }
    
    void main() {
        u = vUv * iResolution;
        ur = iResolution.xy;
        
        if (iFrame < 1) {
            float w = 0.5+sin(0.2*u.x)*0.5;
            float q = length(u-0.5*ur);
            gl_FragColor = vec4(0.1*exp(-0.001*q*q),0,0,w);
            return;
        }
        
        vec2 v = u,
             A = v + vec2(1, 0),
             B = v + vec2(0, 1),
             C = v + vec2(-1, 0),
             D = v + vec2(0, -1);
             
        for (int i = 0; i < 8; i++) {
            v = t(v).xy;
            A = t(A).xy;
            B = t(B).xy;
            C = t(C).xy;
            D = t(D).xy;
        }
        
        vec4 me = t(v);
        vec4 n = t(v, 0, 1),
             e = t(v, 1, 0),
             s = t(v, 0, -1),
             w = t(v, -1, 0);
             
        vec4 ne = .25*(n+e+s+w);
        me = mix(t(v), ne, vec4(0.15,0.15,0.95,0.));
        me.z = me.z - 0.01*(area(A,B,C)+area(B,C,D)-4.);
        vec4 pr = vec4(e.z,w.z,n.z,s.z);
        me.xy = me.xy + 100.*vec2(pr.x-pr.y, pr.z-pr.w)/ur;
        me.xy *= uFluidDecay;
        me.z *= uTrailLength;
        
        if (iMouse.z > 0.0) {
            vec2 mousePos = iMouse.xy;
            vec2 mousePrev = iMouse.zw;
            vec2 mouseVel = mousePos - mousePrev;
            float velMagnitude = length(mouseVel);
            float q = ln(u, mousePos, mousePrev);
            vec2 m = mousePos - mousePrev;
            float l = length(m);
            if (l > 0.0) m = min(1., 10.0) * m / l;
            
            float brushSizeFactor = 1e-4 / uBrushSize;
            float strengthFactor = 0.03 * uBrushStrength;
            float falloff = exp(-brushSizeFactor*q*q);
            falloff = pow(falloff, 0.5);
            me.xyw += strengthFactor * falloff * vec3(m, 10.);
            
            if (velMagnitude < 2.0) {
                float distToCursor = length(u - mousePos);
                float influence = exp(-distToCursor * 0.01);
                float cursorDecay = mix(1.0, uStopDecay, influence);
                me.xy *= cursorDecay;
                me.z *= cursorDecay;
            }
        }
        
        gl_FragColor = clamp(me, -0.4, 0.4);
    }
`;

const displayShader = `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform sampler2D iFluid;
    uniform float uDistortionAmount;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;
    uniform float uColorIntensity;
    uniform float uSoftness;
    varying vec2 vUv;
    
    void main() {
        vec2 fragCoord = vUv * iResolution;
        vec4 fluid = texture2D(iFluid, vUv);
        vec2 fluidVel = fluid.xy;
        float mi = min(iResolution.x, iResolution.y);
        vec2 uv = (fragCoord * 2.0 - iResolution.xy) / mi;
        
        uv += fluidVel * (0.5 * uDistortionAmount);
        float d = -iTime * 0.5;
        float a = 0.0;
        
        for (float i = 0.0; i < 8.0; ++i) {
            a += cos(i * d - a * uv.x);
            d += sin(uv.y * i + a);
        }
        
        d += iTime * 0.5;
        float mixer1 = cos(uv.x * d) * 0.5 + 0.5;
        float mixer2 = sin(uv.y * d) * 0.5 + 0.5;
        float mixer3 = cos(d) * 0.5 + 0.5;
        float smoothAmount = clamp(uSoftness * 0.1, 0.0, 0.9);
        
        mixer1 = mix(mixer1, 0.5, smoothAmount);
        mixer2 = mix(mixer2, 0.5, smoothAmount);
        mixer3 = mix(mixer3, 0.5, smoothAmount);
        
        vec3 col = mix(uColor1, uColor2, mixer1);
        col = mix(col, uColor3, mixer2);
        col = mix(col, uColor4, mixer3);
        col *= uColorIntensity;
        
        gl_FragColor = vec4(col, 1.0);
    }
`;

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

export default function FluidGradient({
    color1 = "#8bfff7",
    color2 = "#6e3466",
    color3 = "#0133ff",
    color4 = "#66d1fe",
    colorIntensity = 0.25,
    opacity = 0.35,
}) {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (!canvasRef.current) return;
        
        const container = canvasRef.current;
        const config = {
            brushSize: 25.0,
            brushStrength: 0.5,
            distortionAmount: 2.5,
            fluidDecay: 0.98,
            trailLength: 0.8,
            stopDecay: 0.85,
            color1,
            color2,
            color3,
            color4,
            colorIntensity,
            softness: 1.0,
        };
        
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            depth: false,
            stencil: false
        });
        
        let width = window.innerWidth;
        let height = window.innerHeight;
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0); 
        
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        
        container.appendChild(renderer.domElement);
        
        const fluidTarget1 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        });
        
        const fluidTarget2 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        });
        
        let currentFluidTarget = fluidTarget1;
        let previousFluidTarget = fluidTarget2;
        let frameCount = 0;
        
        const fluidMaterial = new THREE.ShaderMaterial({
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector2(width, height) },
                iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
                iFrame: { value: 0 },
                iPreviousFrame: { value: null },
                uBrushSize: { value: config.brushSize },
                uBrushStrength: { value: config.brushStrength },
                uFluidDecay: { value: config.fluidDecay },
                uTrailLength: { value: config.trailLength },
                uStopDecay: { value: config.stopDecay },
            },
            vertexShader: vertexShader,
            fragmentShader: fluidShader,
        });
        
        const displayMaterial = new THREE.ShaderMaterial({
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector2(width, height) },
                iFluid: { value: null },
                uDistortionAmount: { value: config.distortionAmount },
                uColor1: { value: new THREE.Vector3(...hexToRgb(config.color1)) },
                uColor2: { value: new THREE.Vector3(...hexToRgb(config.color2)) },
                uColor3: { value: new THREE.Vector3(...hexToRgb(config.color3)) },
                uColor4: { value: new THREE.Vector3(...hexToRgb(config.color4)) },
                uColorIntensity: { value: config.colorIntensity },
                uSoftness: { value: config.softness },
            },
            vertexShader: vertexShader,
            fragmentShader: displayShader,
        });
        
        const geometry = new THREE.PlaneGeometry(2, 2);
        const fluidPlane = new THREE.Mesh(geometry, fluidMaterial);
        const displayPlane = new THREE.Mesh(geometry, displayMaterial);
        
        let mouseX = 0;
        let mouseY = 0;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let lastMoveTime = 0;
        
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            prevMouseX = mouseX;
            prevMouseY = mouseY;
            mouseX = e.clientX - rect.left;
            mouseY = rect.height - (e.clientY - rect.top);
            lastMoveTime = performance.now();
            fluidMaterial.uniforms.iMouse.value.set(mouseX, mouseY, prevMouseX, prevMouseY);
        };
        
        const handleMouseLeave = () => {
            fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        
        let animationFrameId;
        let isVisible = false;
        
        let lastFrameTime = 0;
        const fpsInterval = 1000 / 40; 
        
        function animate(timestamp) {
            animationFrameId = requestAnimationFrame(animate);
            if (!isVisible) return; 
            
            const elapsed = timestamp - lastFrameTime;
            if (elapsed < fpsInterval) return;
            lastFrameTime = timestamp - (elapsed % fpsInterval);
            
            const time = performance.now() * 0.001;
            fluidMaterial.uniforms.iTime.value = time;
            displayMaterial.uniforms.iTime.value = time;
            fluidMaterial.uniforms.iFrame.value = frameCount;
            
            if (performance.now() - lastMoveTime > 100) {
                fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
            }
            
            fluidMaterial.uniforms.iPreviousFrame.value = previousFluidTarget.texture;
            renderer.setRenderTarget(currentFluidTarget);
            renderer.render(fluidPlane, camera);
            
            displayMaterial.uniforms.iFluid.value = currentFluidTarget.texture;
            renderer.setRenderTarget(null);
            renderer.render(displayPlane, camera);
            
            const temp = currentFluidTarget;
            currentFluidTarget = previousFluidTarget;
            previousFluidTarget = temp;
            frameCount++;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                isVisible = entry.isIntersecting;
            });
        }, { threshold: 0 });
        
        observer.observe(container);
        
        const handleResize = () => {
            if (!container) return;
            width = window.innerWidth;
            height = window.innerHeight;
            renderer.setSize(width, height, false);
            fluidMaterial.uniforms.iResolution.value.set(width, height);
            displayMaterial.uniforms.iResolution.value.set(width, height);
            fluidTarget1.setSize(width, height);
            fluidTarget2.setSize(width, height);
        };
        
        window.addEventListener('resize', handleResize);
        animate(performance.now());
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
            geometry.dispose();
            fluidMaterial.dispose();
            displayMaterial.dispose();
            fluidTarget1.dispose();
            fluidTarget2.dispose();
            renderer.dispose();
            
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [color1, color2, color3, color4, colorIntensity, opacity]);
    
    return (
        <div 
            ref={canvasRef} 
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                opacity, 
                pointerEvents: "none",
            }}
            aria-hidden="true"
        />
    );
}
