#version 300 es
precision highp float;

#define MATERIAL_SKY 0
#define MATERIAL_TERRAIN 1
#define MATERIAL_BUILDINGS 2
#define MATERIAL_SCREEN 3

// Sub materials of MATERIAL_BUILDINGS
#define SUBMATERIAL_WOOD -1
#define SUBMATERIAL_CONCRETE 0  // 0 and below have concrete texture.
#define SUBMATERIAL_METAL 1  //>0 is smooth and has specular
#define SUBMATERIAL_BRIGHT_RED 2
#define SUBMATERIAL_DARK_RED 3
#define SUBMATERIAL_BLACK_PURPLE 4
#define SUBMATERIAL_YELLOW 5

const float PI = 3.14159265359;

// Size in pixels of the noise texture
const float NOISE_TEXTURE_SIZE = 512.;

const float COLLISION_TEXTURE_SIZE = 128.;

const float PRERENDERED_TEXTURE_SIZE = 256.;

const int NOISE_TEXTURE_BITMASK = 0x1ff;

// Aspect ratio is fixed to 1.5 by design
const float SCREEN_ASPECT_RATIO = 1.5;

// The field of view, in radians
const float FIELD_OF_VIEW = radians(45.0);

// Projection matrix
const float PROJECTION_LEN = 1. / tan(.5 * FIELD_OF_VIEW);

in vec2 FC;

uniform vec2 iR;
uniform vec3 iP;
uniform vec4 iD;
uniform vec4 iS;
uniform mat3 iM;
uniform lowp int iF0;

///// I/O /////

// Screen position, in pixels. Bottom left is (0, 0), top right is (iResolution.x-1, iResolution.y-1).
#define fragCoord FC

// Output color
#define oColor oC
out vec4 oColor;

///// Core uniforms /////

// Screen resolution in pixels.
#define iResolution iR

// Camera position
#define iCameraPos iP

// Camera directiom
#define iCameraDir iD.xyz

// Time in seconds
#define iTime iD.w

// Sunlight direction
#define iSunDirection iS.xyz

// Current level of water
#define iWaterLevel iS.w

// Camera rotation matrix
#define iCameraMat3 iM

///// Textures /////

// Noise texture
#define iNoise tN
uniform highp sampler2D iNoise;

// Heightmap texture
#define iHeightmap tH
uniform highp sampler2D iHeightmap;

// Prerendered texture
#define iPrerendered tP
uniform highp sampler2D iPrerendered;

///// Game object uniforms /////

// Flashlight on
#define iFloppyVisible ((iF0 & 0x01) != 0)

//=== STATE ===

// Keep the current epsilon global
float epsilon;

//=== COLORS ===

const vec3 COLOR_SKY = vec3(.4, .8, 1);
const vec3 COLOR_SUN = vec3(1.065, .95, .85);

const vec3 TERRAIN_SIZE = vec3(120., 19., 78.);
const float TERRAIN_OFFSET = 3.;
const float UNDERGROUND_LEVEL = -TERRAIN_OFFSET + 0.0005;

// maximums
const int MAX_ITERATIONS = 100;
const float MIN_DIST = 0.15;
const float MAX_DIST = 150.;
const float HORIZON_DIST = 500.;

float clamp01(float v) {
  return clamp(v, 0., 1.);
}

vec2 clamp01(vec2 v) {
  return clamp(v, 0., 1.);
}

// polynomial smooth min (k = 0.1);
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.) / k;
  return min(a, b) - h * h * k / 4.;
}

vec4 packFloat(float v) {
  vec4 enc = clamp01(v) * (vec4(1., 255., 65025., 160581375.) * .999998);
  enc = fract(enc);
  enc -= enc.yzww * vec4(1. / 255., 1. / 255., 1. / 255., 0.);
  return enc;
}

float unpackFloat(vec4 rgba) {
  return dot(rgba, vec4(1.0, 1. / 255., 1. / 65025., 1. / 160581375.));
}

/**
 Returns 3D value noise (in .x)  and its derivatives (in .yz).
 Based on https://www.iquilezles.org/www/articles/gradientnoise/gradientnoise.htm by Iq
*/
vec3 noiseDxy(vec2 x) {
  vec4 T = texelFetch(iNoise, ivec2(floor(x)) & NOISE_TEXTURE_BITMASK, 0);
  float xba = T.y - T.x, xca = T.z - T.x;
  float abcd = T.w - xba - T.z;
  vec2 ffract = fract(x), fsquared = ffract * ffract;
  vec2 u = fsquared * (3. - 2. * ffract);
  return vec3((T.x + xba * u.x + xca * u.y + abcd * u.x * u.y),
      (30. * fsquared * (ffract * (ffract - 2.) + 1.)) * (vec2(xba, xca) + abcd * u.yx));
}

int subMaterial = SUBMATERIAL_CONCRETE;
float subMaterialDistance = MAX_DIST;

// Updates the subMaterialDistance and subMaterial if the distance is lower
void updateSubMaterial(int sm, float dist) {
  if (dist < epsilon && dist != subMaterialDistance) {
    subMaterial = sm;
    subMaterialDistance = dist;
  }
}

//=== PRIMITIVES ===
float sphere(vec3 p, float s) {
  return length(p) - s;
}

float cuboid(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float cube(vec3 p, float s) {
  vec3 d = abs(p) - s;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float cylinder(vec3 p, float r, float l) {
  float d = length(p.xy) - r;
  return max(d, abs(p.z) - l);
}

float torus(vec3 p, vec2 t) {
  return length(vec2(length(p.xz) - t.x, p.y)) - t.y;
}

//=== OPERATIONS ===

// Rotation by a dynamic angle
mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, s, -s, c);
}

float objectFloppy(vec3 p) {
  float clip = cuboid(p - vec3(.056, 0, 0), vec3(.035, .006, .05));
  float body = cuboid(p, vec3(.09, .005, .0937));
  if (body < clip) { 
    updateSubMaterial(SUBMATERIAL_BRIGHT_RED, body);
    return body;
  }
  updateSubMaterial(SUBMATERIAL_METAL, clip);
  return clip;
}

float terrain(vec3 p) {
  vec3 d = abs(vec3(p.x, p.y + TERRAIN_OFFSET, p.z)) - vec3(TERRAIN_SIZE.x * .5, 0., TERRAIN_SIZE.z * .5);
  if (d.x < 0. && d.z < 0.) {
    float h = unpackFloat(textureLod(iHeightmap, p.xz / TERRAIN_SIZE.xz + .5, 0.));
    float h1 = 1. - h;
    d.y -= h * TERRAIN_SIZE.y + h1 * h1* h1;
  }
  return min(d.y, 0.0) + length(max(d, 0.0));
}

float nonTerrain(vec3 p) {
  float plank = cuboid(p - vec3(-47, .5, -26), vec3(1,.5,3));
  float objects = MAX_DIST;
  
  if (iFloppyVisible) {
    objects = min(objects, objectFloppy(p - vec3(-46.5, 1.01, -25)));
  }

  float structures = plank;

  if (objects < structures) {
    return objects;
  }

  updateSubMaterial(SUBMATERIAL_CONCRETE, structures);
  return structures;
}

int material = MATERIAL_SKY;

float distanceToNearestSurface(vec3 p) {
  float t = terrain(p);
  if (t > epsilon) {
    float n = nonTerrain(p);
    if (t >= n) {
      material = MATERIAL_BUILDINGS;
      return n;
    }
  }
  material = MATERIAL_TERRAIN;
  return t;
}

vec3 computeNonTerrainNormal(vec3 p) {
  const vec2 S = vec2(0.001, 0);
  return normalize(vec3(nonTerrain(p + S.xyy), nonTerrain(p + S.yxy), nonTerrain(p + S.yyx)) - nonTerrain(p));
}

vec3 computeTerrainNormal(vec3 p, float dist) {
  vec2 S = vec2(mix(0.03, 0.001, min(dist / TERRAIN_SIZE.x, 1.)), 0);
  return normalize(vec3(terrain(p + S.xyy), terrain(p + S.yxy), terrain(p + S.yyx)) - terrain(p));
}

float rayTraceGround(vec3 p, vec3 dir) {
  float t = (-TERRAIN_OFFSET - p.y) / dir.y;
  return t >= 0. && t < HORIZON_DIST ? t : HORIZON_DIST;
}

float rayMarch(vec3 p, vec3 dir, float min_epsilon, float dist) {
  float result = HORIZON_DIST;
  float prevNear = min_epsilon;

  for (int i = 0;; i++) {
    vec3 hit = p + dir * dist;

    epsilon = min_epsilon * max(dist, 1.);

    if (hit.y <= UNDERGROUND_LEVEL || dist >= MAX_DIST) {
      float t = (-TERRAIN_OFFSET - p.y) / dir.y;
      if (t >= 0. && t < HORIZON_DIST) {
        material = MATERIAL_TERRAIN;
        return t;
      }
      break;  // Nothingness...
    }

    if (hit.y > 45.) {
      break;  // Too high
    }

    float nearest = distanceToNearestSurface(hit);

    if (nearest < 0.) {
      dist -= prevNear;
      nearest = prevNear / 2.;
    }

    dist += nearest;

    if (nearest <= epsilon || i >= MAX_ITERATIONS) {
      return dist;
    }

    prevNear = nearest;
  }

  material = MATERIAL_SKY;
  return HORIZON_DIST;
}

#define SHADOW_ITERATIONS 50
float getShadow(vec3 p, float camDistance, vec3 n, float res) {
  float dist = clamp(camDistance * 0.005, 0.01, .1);  // start further out from the surface if the camera is far away

  p = p + n * dist;  // Jump out of the surface by the normal * that dist

  float maxHitY = iWaterLevel - epsilon * 2.;

  for (float i = 1.; i < float(SHADOW_ITERATIONS); i++) {
    vec3 hit = p + iSunDirection * dist;

    if (dist >= 80. || hit.y > 45. || hit.y < maxHitY || length(p) >= MAX_DIST) {
      break;  // Nothing to render so far
    }

    float nearest = nonTerrain(hit);

    float shadowEpsilon = max(epsilon, 0.01 * min(1., dist) + i * (.01 / float(SHADOW_ITERATIONS)));
    if (nearest <= shadowEpsilon) {
      return 0.;  // Hit or inside something.
    }

    res = min(res, 85. * nearest / dist);
    if (res < 0.078) {
      return 0.;  // Dark enough already.
    }

    dist += nearest + epsilon;
  }
  return res;
}

float rayTraceWater(vec3 p, vec3 dir) {
  float t = (iWaterLevel - p.y) / dir.y;
  return min(t >= 0. ? t : HORIZON_DIST, HORIZON_DIST);
}

// Inspired from https://www.shadertoy.com/view/Xl2XRW
vec3 waterFBM(vec2 p) {
  vec3 f = vec3(0);
  float tot = 0.;
  float a = 1.;

  float flow = 0.;
  float distToCameraRatio = (1. - length(iCameraPos.xz - p) / HORIZON_DIST);
  float octaves = 5. * distToCameraRatio * distToCameraRatio;
  for (float i = 0.; i < octaves; ++i) {
    p += iTime * .5;
    flow *= -.75;
    vec3 v = noiseDxy(p + sin(p.yx * .5 + iTime * .5) * .5);
    f += v * a;
    p += v.yz * .43;
    p *= 2.;
    tot += a;
    a *= .75;
  }
  return f / tot;
}

vec3 applyFog(vec3 rgb, float dist, vec3 rayDir) {
  float dRatio = min(dist / HORIZON_DIST, 1.);

  float fogAmount = clamp01(pow(dRatio, 3.5) + 1.0 - exp(-dist * 0.005));
  float sunAmount = max(dot(rayDir, iSunDirection), 0.0);
  vec3 fogColor = mix(COLOR_SKY, COLOR_SUN, pow(sunAmount, 10.0));
  return mix(rgb, fogColor, fogAmount);
}

vec3 intersectWithWorld(vec3 p, vec3 dir) {
  vec4 packed = texelFetch(iPrerendered, ivec2(fragCoord * PRERENDERED_TEXTURE_SIZE / iResolution), 0);
  float unpacked = uintBitsToFloat(
      (uint(packed.x * 255.) << 24 | uint(packed.y * 255.) << 16 | uint(packed.z * 255.) << 8 | uint(packed.z * 255.)));

  float dist = rayMarch(p, dir, 0.001, unpacked);
  float wdist = rayTraceWater(p, dir);

  vec3 color;
  vec3 normal = vec3(0, 1, 0);
  float mdist = dist;

  vec3 hit = p + dir * dist;

  bool isWater = wdist < HORIZON_DIST && wdist < dist;
  vec3 waterColor;
  float waterOpacity = 0.;
  if (isWater) {
    waterOpacity = mix(0.2, 1., clamp01((dist - wdist) / TERRAIN_OFFSET));

    vec3 waterhit = p + dir * wdist;
    vec3 waterXYD = mix(vec3(0),
        waterFBM(waterhit.xz * (.7 - iWaterLevel * .02)) * (1. - length(waterhit) / (.9 * HORIZON_DIST)), waterOpacity);

    normal = normalize(vec3(waterXYD.y, 1., waterXYD.x));

    wdist -= abs(waterXYD.z) * waterOpacity * .6;
    mdist = wdist;

    waterColor = mix(vec3(.25, .52, .73), vec3(.15, .62, .83), clamp01(abs(waterXYD.z) - waterOpacity));
  }

  int mat = material;
  int submat = subMaterial;
  if (material == MATERIAL_SKY) {
    color = COLOR_SKY;
  } else {
    vec3 hitNormal;

    if (hit.y <= UNDERGROUND_LEVEL) {
      hitNormal = vec3(0, 1, 0);
      color = vec3(1, 1, 1);
    } else {
      color = vec3(.8);

      switch (mat) {
        case MATERIAL_TERRAIN:
          hitNormal = computeTerrainNormal(hit, dist);

          color = mix(vec3(.93, .8, .64),
                      mix(vec3(.69 + texture(iNoise, hit.xz * 0.0001).x, .67, .65), vec3(.38, .52, .23),
                          dot(hitNormal, vec3(0, 1, 0))),
                      clamp01(hit.y * .5 - 1.)) +
              texture(iNoise, hit.xz * 0.15).x * 0.1 + texture(iNoise, hit.xz * 0.01).y * 0.1;
          ;
          break;
        case MATERIAL_BUILDINGS:
          hitNormal = computeNonTerrainNormal(hit);

          switch (submat) {
            case SUBMATERIAL_METAL: color = vec3(1); break;  // extra bright
            case SUBMATERIAL_BRIGHT_RED: color = vec3(1, 0, 0); break;
            case SUBMATERIAL_DARK_RED: color = vec3(.5, 0, 0); break;
            case SUBMATERIAL_BLACK_PURPLE: color = vec3(.2, .1, .2); break;
            case SUBMATERIAL_YELLOW: color = vec3(1, .95, .8); break;
            case SUBMATERIAL_WOOD: color = .8 * vec3(.8, .6, .4); break;
            default:
              vec4 concrete = (texture(iNoise, hit.xy * .35) * hitNormal.z +
                  texture(iNoise, hit.yz * .35) * hitNormal.x + texture(iNoise, hit.xz * .35) * hitNormal.y - 0.5);
              color += 0.125 * (concrete.x - concrete.y + concrete.z - concrete.w);
              break;
          }
      }

      normal = normalize(mix(hitNormal, normal, waterOpacity));
    }
  }

  float specular = isWater || (mat == MATERIAL_BUILDINGS && submat > SUBMATERIAL_CONCRETE)
      ? pow(clamp01(dot(iSunDirection, reflect(dir, normal))), 50.)
      : 0.;

  float lambert1 = clamp01(dot(iSunDirection, normal));
  float lambert2 = clamp01(dot(iSunDirection * vec3(-1, 1, -1), normal));

  float lightIntensity = lambert1 + lambert2 * .15;
  if (mat == MATERIAL_TERRAIN) {
    lightIntensity = pow(lightIntensity * mix(.9, 1.02, lambert1 * lambert1), 1. + lambert1 * .6);
  }

  lightIntensity = mix(lightIntensity, lambert1, waterOpacity);

  float shadow = 1.;
  if (material != MATERIAL_SKY) {
    shadow = getShadow(p + dir * mdist, mdist, normal, 1.);
  }

  color = mix(color, waterColor, waterOpacity);
  color = (color * (COLOR_SUN * lightIntensity) + specular) * mix(0.38 + (1. - lightIntensity) * .2, 1., shadow);

  return applyFog(color, mdist, dir);
}

/**********************************************************************/
/* collision shader
/**********************************************************************/

void main_c() {
  vec3 ray = vec3(0, 0, 1);
  ray.xz *= rot(fragCoord.x * (2. * PI / COLLISION_TEXTURE_SIZE) + PI);
  oColor = packFloat(.2 -
      distanceToNearestSurface(
          vec3(iCameraPos.x, iCameraPos.y + (fragCoord.y / (COLLISION_TEXTURE_SIZE * .5) - 1.) - .8, iCameraPos.z) +
          normalize(ray) * MIN_DIST));
}

/**********************************************************************/
/* prerender shader
/**********************************************************************/

void main_p() {
  vec2 screen = fragCoord / (PRERENDERED_TEXTURE_SIZE * .5) - 1. + .5 / PRERENDERED_TEXTURE_SIZE;

  vec3 ray = normalize(iCameraMat3 * vec3(screen.x * -SCREEN_ASPECT_RATIO, screen.y, PROJECTION_LEN));

  float dist = rayMarch(iCameraPos, ray, 1.2 / PRERENDERED_TEXTURE_SIZE, MIN_DIST);

  uint packed = floatBitsToUint(dist >= MAX_DIST ? MAX_DIST : dist - epsilon);
  oColor = vec4(float((packed >> 24) & 0xffu) / 255., float((packed >> 16) & 0xffu) / 255.,
      float((packed >> 8) & 0xffu) / 255., float(packed & 0xffu) / 255.);
}

/**********************************************************************/
/* main shader
/**********************************************************************/

// Main shader
void main_m() {
  vec2 screen = fragCoord / (iResolution * .5) - 1.;

  vec3 ray = normalize(iCameraMat3 * vec3(screen.x * -SCREEN_ASPECT_RATIO, screen.y, PROJECTION_LEN));

  oColor = vec4(intersectWithWorld(iCameraPos, ray), 1);
}

/**********************************************************************/
/* heightmap shader
/**********************************************************************/

float heightmapCircle(vec2 coord, float centerX, float centerY, float radius, float smoothness) {
  vec2 dist = coord - vec2(centerX, centerY);
  return clamp01(1. - smoothstep(radius - (radius * smoothness), radius, dot(dist, dist) * 4.));
}

void main_h() {
  vec2 coord = fragCoord / (iResolution * 0.5) - 1., size = vec2(1.3, 1.), derivative = vec2(0.);
  float heightA = 0., heightB = 1., persistence = 1., normalization = 0., octave = 1.;
  for (; octave < 11.;) {
    vec3 noisedxy = noiseDxy(21.1 + (coord * size) * rot(octave++ * 2.5));
    derivative += noisedxy.yz;
    heightA += persistence * (1. - noisedxy.x) / (1. + dot(derivative, derivative));
    heightB += persistence * (.5 - noisedxy.x);
    normalization += persistence;
    persistence *= 0.5;
    size *= 1.8;
  }
  heightA /= normalization;
  heightB *= .5;
  float tmask = (length((coord * (1.2 - heightB + heightA))) *
            clamp01(heightB + .56 - .5 * heightA * coord.x * (1. - coord.y * .5))),
        circles = heightmapCircle(coord, -.45, -.52, 1., 2.3) + heightmapCircle(coord, -.6, -.1, 1., 3.3) +
      heightmapCircle(coord, .5, -.7, 1., 5.) + heightmapCircle(coord, .6, .53, heightA * 2., heightB * 5.);
  tmask = clamp01(1. - smin(tmask, 1. - mix(0., heightA * 2., circles), .05 + heightB * .5));
  vec2 distHV = 1. - abs(coord) + heightA * .04;
  tmask = smin(tmask, smin(distHV.x, distHV.y, 0.3) * 2., .1);
  oColor = packFloat(smin(heightA, tmask, 0.01) * 1.33 - .045);
}