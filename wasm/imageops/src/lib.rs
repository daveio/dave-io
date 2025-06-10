use image::DynamicImage;
use wasm_bindgen::prelude::*;

extern crate wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct ImageProcessor {
    image: Option<DynamicImage>,
}

#[wasm_bindgen]
impl Default for ImageProcessor {
    fn default() -> Self {
        Self::new()
    }
}

impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ImageProcessor {
        ImageProcessor { image: None }
    }

    #[wasm_bindgen]
    pub fn get_info(&self) -> String {
        format!(
            r#"{{
                "wasm_version": "0.1.0",
                "rust_version": "{}",
                "image_loaded": {},
                "supported_formats": ["png", "jpeg", "webp"],
                "supported_operations": ["resize", "crop", "rotate", "brightness", "contrast", "gamma"],
                "memory_usage": "wasm_heap"
            }}"#,
            env!("CARGO_PKG_RUST_VERSION"),
            self.image.is_some()
        )
    }

    #[wasm_bindgen]
    pub fn load_image(&mut self, data: &[u8]) -> Result<String, JsValue> {
        console_log!("Loading image of {} bytes", data.len());

        let cursor = Cursor::new(data);
        match image::load_from_memory(data) {
            Ok(img) => {
                let (width, height) = img.dimensions();
                self.image = Some(img);
                Ok(format!(
                    r#"{{"success": true, "width": {}, "height": {}, "format": "detected"}}"#,
                    width, height
                ))
            }
            Err(e) => Err(JsValue::from_str(&format!("Failed to load image: {}", e))),
        }
    }

    #[wasm_bindgen]
    pub fn resize(&mut self, width: u32, height: u32) -> Result<String, JsValue> {
        match &self.image {
            Some(img) => {
                let resized = img.resize(width, height, image::imageops::FilterType::Lanczos3);
                self.image = Some(resized);
                Ok(format!(
                    r#"{{"success": true, "operation": "resize", "width": {}, "height": {}}}"#,
                    width, height
                ))
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn crop(&mut self, x: u32, y: u32, width: u32, height: u32) -> Result<String, JsValue> {
        match &self.image {
            Some(img) => {
                let cropped = img.crop_imm(x, y, width, height);
                self.image = Some(cropped);
                Ok(format!(
                    r#"{{"success": true, "operation": "crop", "x": {}, "y": {}, "width": {}, "height": {}}}"#,
                    x, y, width, height
                ))
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn rotate90(&mut self) -> Result<String, JsValue> {
        match &self.image {
            Some(img) => {
                let rotated = img.rotate90();
                self.image = Some(rotated);
                Ok(r#"{"success": true, "operation": "rotate90"}"#.to_string())
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn adjust_brightness(&mut self, value: i32) -> Result<String, JsValue> {
        match &self.image {
            Some(img) => {
                let adjusted = img.brighten(value);
                self.image = Some(adjusted);
                Ok(format!(
                    r#"{{"success": true, "operation": "brightness", "value": {}}}"#,
                    value
                ))
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn adjust_contrast(&mut self, contrast: f32) -> Result<String, JsValue> {
        match &self.image {
            Some(img) => {
                let adjusted = img.adjust_contrast(contrast);
                self.image = Some(adjusted);
                Ok(format!(
                    r#"{{"success": true, "operation": "contrast", "value": {}}}"#,
                    contrast
                ))
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn to_webp(&self, _quality: u8) -> Result<Vec<u8>, JsValue> {
        match &self.image {
            Some(img) => {
                let mut buffer = Vec::new();
                let mut cursor = Cursor::new(&mut buffer);

                match img.write_to(&mut cursor, ImageFormat::WebP) {
                    Ok(_) => Ok(buffer),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to encode WebP: {}", e))),
                }
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn to_jpeg(&self, _quality: u8) -> Result<Vec<u8>, JsValue> {
        match &self.image {
            Some(img) => {
                let mut buffer = Vec::new();
                let mut cursor = Cursor::new(&mut buffer);

                match img.write_to(&mut cursor, ImageFormat::Jpeg) {
                    Ok(_) => Ok(buffer),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to encode JPEG: {}", e))),
                }
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn to_png(&self) -> Result<Vec<u8>, JsValue> {
        match &self.image {
            Some(img) => {
                let mut buffer = Vec::new();
                let mut cursor = Cursor::new(&mut buffer);

                match img.write_to(&mut cursor, ImageFormat::Png) {
                    Ok(_) => Ok(buffer),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to encode PNG: {}", e))),
                }
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }

    #[wasm_bindgen]
    pub fn get_dimensions(&self) -> Result<String, JsValue> {
        match &self.image {
            Some(img) => {
                let (width, height) = img.dimensions();
                Ok(format!(r#"{{"width": {}, "height": {}}}"#, width, height))
            }
            None => Err(JsValue::from_str("No image loaded")),
        }
    }
}

#[wasm_bindgen]
pub fn get_wasm_info() -> String {
    format!(
        r#"{{
            "name": "imageops",
            "version": "0.1.0",
            "wasm_bindgen_version": "{}",
            "build_timestamp": "{}",
            "features": ["webp", "jpeg", "png", "resize", "crop", "rotate", "brightness", "contrast"],
            "memory_allocator": "wee_alloc",
            "optimization": "size"
        }}"#,
        env!("CARGO_PKG_VERSION"),
        "compile_time"
    )
}
