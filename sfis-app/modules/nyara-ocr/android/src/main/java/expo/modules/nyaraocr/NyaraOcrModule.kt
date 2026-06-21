package expo.modules.nyaraocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NyaraOcrModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("NyaraOcr")

    AsyncFunction("recognizeText") { uri: String, promise: Promise ->
      try {
        val image = InputImage.fromFilePath(context, Uri.parse(uri))
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

        recognizer.process(image)
          .addOnSuccessListener { result ->
            promise.resolve(serialize(result))
          }
          .addOnFailureListener { error ->
            promise.reject("ERR_NYARA_OCR_FAILED", error.message ?: "Text recognition failed.", error)
          }
      } catch (error: Exception) {
        promise.reject("ERR_NYARA_OCR_INPUT", error.message ?: "Could not read this image.", error)
      }
    }
  }

  private fun serialize(result: Text): Map<String, Any?> {
    return mapOf(
      "text" to result.text,
      "confidence" to null,
      "blocks" to result.textBlocks.map { block ->
        mapOf(
          "text" to block.text,
          "lines" to block.lines.map { line ->
            mapOf(
              "text" to line.text,
              "elements" to line.elements.map { element ->
                mapOf("text" to element.text)
              }
            )
          }
        )
      }
    )
  }
}
