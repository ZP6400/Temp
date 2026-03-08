Nicholas Armstrong, Kenny Maurin, Zackary Perry
CS 4731: Computer Graphics - Final Project

For our final project, we have developed a scene of a boat on a lake, surrounded by mountains.

The 3D models present in our scene are the boat, the mountains, and the propeller. 
Model transformations can be found in the water, as well as the boat and propeller if the SHIFT key is pressed. 
This causes the boat and propeller to both rotate along the Z-axis, and the propeller to also rotate along the Y-axis. 
A point light is present as the sun, and a spotlight is present on the front of our boat. 
The water is rendered using a separate shader which implements physically-based lighting, while the rest of the scene is illuminated with Phong shading.
The camera is programmed to zoom in when the C key is pressed, giving us a camera animation. 
The boat and propeller together serve as our hierarchical model, while shadows and reflections have been implemented as well. 
There is also a textured skybox to serve as the background of the scene.

Controls:
SHIFT - Toggle boat animation
C - Zoom in/out
S - Toggle shadows
L - Toggle diffuse and specular components of light
N - Generate new water surface
W - Display water as wireframe

One challenge we faced while completing this project was finding object files that would properly load into our scene. 
Another challenge was that our scene experienced major performance issues when we first implemented the water animations. 
It ran pretty poorly, but the final version of the project has remedied this issue. We also had trouble with the shadow of the boat not rendering correctly, which we eventually fixed by adjusting the near plane of the point light projection matrix. Finally, multiple team members got sick in the final few days of the term, resulting in us not completing all of the requirements before the deadline.

Nicholas was responsible for implementing the water, as well as the majority of lighting effects, such as the spotlight, point light, water shaders, and the Phong shader. He additionally implemented the material handling, texture rendering, and worked out some critical bugs in the shadow implementation.
Kenny was responsible for writing the README file and finding the boat and mountain obj files.
Zack was responsible for implementing the objects into the scene, the model and camera transformations, skybox implementation, and hierarchical model. He also performed some optimizations and built the initial implementation of shadows