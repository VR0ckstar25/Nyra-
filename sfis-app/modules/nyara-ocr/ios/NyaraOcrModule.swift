import ExpoModulesCore
import UIKit
import Vision

public class NyaraOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NyaraOcr")

    AsyncFunction("recognizeText") { (url: URL) async throws -> [String: Any?] in
      guard let image = UIImage(contentsOfFile: url.path)?.cgImage else {
        throw NSError(domain: "NyaraOcr", code: 1, userInfo: [
          NSLocalizedDescriptionKey: "Could not read this image."
        ])
      }

      let observations = try recognize(in: image)
      let lines = observations.compactMap { $0.topCandidates(1).first }
      let text = lines.map(\.string).joined(separator: "\n")
      let confidence = lines.isEmpty ? nil : lines.map(\.confidence).reduce(0, +) / Float(lines.count)

      return [
        "text": text,
        "confidence": confidence,
        "blocks": lines.map { candidate in
          [
            "text": candidate.string,
            "lines": [
              [
                "text": candidate.string,
                "elements": candidate.string.split(separator: " ").map { ["text": String($0)] }
              ]
            ]
          ]
        }
      ]
    }
  }

  private func recognize(in image: CGImage) throws -> [VNRecognizedTextObservation] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.minimumTextHeight = 0.01

    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    try handler.perform([request])
    return request.results ?? []
  }
}
